const crypto = require('crypto')
const pool=require('../../pool')

exports.Login = (req, res) => {
    const status = req.body.status
    const userId = req.body.userid
    const password = req.body.password

    const DataCheck=()=>{
        return new Promise(((resolve,reject)=>{
           if(!status || !userId || !password){
               return reject({
                   code: 'request_body_error',
                   message:'Request body is not defined'
               })
           }
           else{
               return resolve()
           }
        }))
    }

    const UserCheck=async ()=>{
        try{
            const connection = await pool.getConnection(async conn => conn)
            try{
                const [rows] = await connection.query(`SELECT * FROM USER WHERE UserId=?`,[userId])
                connection.release()
                if(!rows[0]){
                    return Promise.reject({
                        code:'no_user',
                        message:'Cannot find user'
                    })
                }
                return Promise.resolve(rows)
            }
            catch (err) {
                console.error(error)
                return Promise.reject({
                    code:'no_user',
                    message:'Cannot find user'
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

    const PWCheck=(rows)=>{
        let user = rows[0]
        crypto.pbkdf2(password, user.salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, derivedKey)=>{
            if (err)
                throw err
            if (derivedKey.toString('base64')===user.Password){
                return Promise.resolve()
            }
            else{
                return Promise.reject({
                    code:'password_error',
                    message:'Password is wrong',
                })
            }
        })
    }

    DataCheck()
        .then(UserCheck)
        .then(PWCheck)
        .then(()=>{
            req.session.sid=userId
            res.status(200).json({userId:userId})
        })
        .catch((err)=>{
            console.log(err)

            res.status(500).json(err|err.message)
        })
}