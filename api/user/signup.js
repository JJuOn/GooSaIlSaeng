const crypto = require('crypto')
const pool=require('../../pool')

exports.Signup = (req, res) => {
    const status = req.body.status
    const numId = req.body.numId
    const name = req.body.name
    const userId = req.body.userid
    const password = req.body.password

    const DataCheck=()=>{
        return new Promise((resolve, reject)=>{
            if(!status || !numId || !name || !userId || !password){
                return reject({
                    code:'request_body_error',
                    message:'Request body is undefined'
                })
            }
            else{
                return resolve()
            }
        })
    }

    const UserCheck=async ()=>{
        try{
            const connection=await pool.getConnection(async conn => conn)
            try{
                const [rows]=await connection.query(`SELECT * FROM ${status} WHERE NUMID=? || USERID=?`,[numId,userId])
                connection.release()
                if(rows[0]){
                    return Promise.reject({
                        code:'user_already_exists',
                        message:'User already exists'
                    })
                }
                else{
                    return Promise.resolve()
                }
            }
            catch (err) {
                console.error(err)
                return Promise.reject({
                    code:'database_query_error',
                    message:'database_query_error'
                })
            }
        }
        catch{
            return Promise.reject({
                code:'database_connection_error',
                message:'Failed to connect database'
            })
        }
    }

    const Create=async ()=>{
        crypto.randomBytes(64,(err,buf)=>{
            if (err)
                throw err
            let salt = buf.toString('base64')
            let key=crypto.pbkdf2Sync(password, salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512')
            let derivedKey=key.toString('base64');
            const doCreate=async ()=>{
                try{
                    const connection=await pool.getConnection(async conn=>conn)
                    try{
                        const result = await connection.query(`INSERT INTO ${status} (NUMID,NAME,USERID,PASSWORD,CREATED,SALT) VALUES (?,?,?,?,NOW(),?)`,[numId,name,userId,derivedKey,salt])
                        connection.release()
                        return Promise.resolve()
                    }
                    catch (err){
                        console.error(err)
                        return Promise.reject({
                            code:'database_error',
                            message:'Database error'
                        })
                    }
                }
                catch{
                    return Promise.reject({
                        code:'database_error',
                        message:'Database error'
                    })
                }
            }
            doCreate()
        })
    }
    DataCheck()
        .then(UserCheck)
        .then(Create)
        .then(()=>{
            res.status(200).json({userId:userId})
        })
        .catch((err)=>{
            console.log(err)
            res.status(500).json(err|err.message)
        })
}