const crypto = require('crypto')
const pool = require('../../pool')

let modify = {}

/* modify.get_Modify = (req, res) => {
    try {
        if (!req.session.sid) {
            res.status(200).redirect('/')
        } else {
                res.render('pw_modify.ejs', {
                temp:'temp',
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send("no")
    } 

} */

modify.Modify = (req, res) => {
    if (!req.session.user) {
        res.redirect('/')
    } else {
        const userid = req.session.user.userid

        const cur_pw = req.body.cur_password
        const new_pw = req.body.new_password
        const chk_pw = req.body.password_chk

        const DataCheck = () => {
            return new Promise((resolve, reject) => {
                if (!cur_pw || !new_pw || !chk_pw) {
                    return reject({
                        code: 'request_body_error',
                        message:'Request body is not defined'
                    })
                } else {
                    return resolve()
                }
            })
        }

        const UserCheck = async () => {
            try {
                const connection = await pool.getConnection(async conn => conn)
                try {
                    const [rows] = await connection.query(`SELECT * FROM USER WHERE UserId = ?`, [userid])
                    connection.release()
                    if(!rows[0]){
                        return Promise.reject({
                            code:'no_user',
                            message:'Cannot find user'
                        })
                    }
                    return Promise.resolve(rows)
                } catch (err) {
                    return Promise.reject({
                        code:'no_user',
                        message:'Cannot find user'
                    })
                }
            } catch (err) {
                return Promise.reject({
                    code:'database_connection_error',
                    message:'Failed to connect database'
                })
            }
        }
    
        const PWCheck = (rows) => {
            const cur_encrypted_pw = rows[0].password
            const cur_salt = rows[0].salt

            return new Promise((resolve, reject) => {
                try {
                    crypto.pbkdf2(cur_pw, cur_salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, derivedKey) => {
                        if (err) throw err

                        if (derivedKey.toString('base64') === cur_encrypted_pw) {
                            resolve()
                        } else {
                            reject({
                                code:'cur_password_error',
                                message:'Current Password is wrong',
                            })
                        }
                    })
                } catch (err) {
                    console.log(err)
                    reject(err)
                }
            })
        }

        const EqualCheck = () => {
            if (new_pw !== chk_pw) {
                return Promise.reject({
                    code:'password_error',
                    message:'New Password Check Mismatch',
                })
            } else {
                return Promise.resolve()
            }
        }

        const Update = async () => {
            crypto.randomBytes(64, (err, buf) => {
                if (err) throw err

                let new_salt = buf.toString('base64')
                let new_key = crypto.pbkdf2Sync(new_pw, new_salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512')
                let new_derived = new_key.toString('base64')

                const doUpdate = async () => {
                    try {
                        const connection = await pool.getConnection(async conn => conn)
                        try {
                            const result = await connection.query(`UPDATE user SET password = ?, salt = ? WHERE userid = ?`, [new_derived, new_salt, userid])
                            connection.release()
                            return Promise.resolve()
                        } catch (err){
                            console.error(err)
                            return Promise.reject({
                                code:'database_error',
                                message:'Database error'
                            })
                        }
                    } catch (err) {
                        return Promise.reject({
                            code:'database_error',
                            message:'Database error'
                        })
                    }
                }
                doUpdate()
            })
        }

        DataCheck()
        .then(UserCheck)
        .then(PWCheck)
        .then(EqualCheck)
        .then(Update)
        .then(() => {
            res.status(200)
            res.send(`
                <!DOCTYPE html>
                <head>
                    <title>비밀번호 변경</title>
                </head>

                <body>
                    <div><h3>변경되었습니다.</h3></div>
                    <p><a href="/main.html">HOME</a></p>
                </body>
            `)
        })
        .catch((err) => {
            console.log(err)

            res.status(500).send(`
            <p>${err.message || err}</p>
            <p><a href='/login.html'/>다시 변경하기</p>
            `)
        })
    }
}

module.exports = modify