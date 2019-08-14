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
                console.error(err)
                return Promise.reject({
                    code:'no_user',
                    message:'Cannot find user'
                })
            }
        }
        catch (err) {
            return Promise.reject({
                code:'database_connection_error',
                message:'Failed to connect database'
            })
        }
    }

    const PWCheck = (rows) => {
        let user = rows[0]

        return new Promise((resolve, reject) => {
            try {
                crypto.pbkdf2(password, user.salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, derivedKey) => {
                    if (err) throw err
                    
                    if (derivedKey.toString('base64')===user.password){
                        resolve(user)
                    }
                    else{
                        reject({
                            code:'password_error',
                            message:'Password is wrong',
                        })
                    }
                })
            } catch (err) {
                console.log(err)
                reject(err)
            }
        })
    }

    DataCheck()
        .then(UserCheck)
        .then(PWCheck)
        .then((user)=>{
            // req.session.sid=userId
            req.session.user = {
                userid: userId,
                numid: user.numid,
                name: user.name,
                status: user.status,
            }

            res.redirect('/main')
        })
        .catch((err)=>{
            console.log(err)

            //res.status(500).json(err.message || err)
            res.status(500).send(`
            <p>${err.message || err}</p>
            <p><a href='/login'/>다시 로그인하기</p>
            `)
        })
}