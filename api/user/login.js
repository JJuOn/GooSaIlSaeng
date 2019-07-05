const crypto = require('crypto')
const mysql = require('mysql')
const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
})
db.connect()

exports.Login = (req, res) => {
    const status = req.body.status
    const userId = req.body.userid
    const password = req.body.password
    
    db.query(`SELECT * FROM ${status} where UserId=?`, [userId], (err, results) => {
        if (err) throw err;
        if (!results[0]) {      // 없는 아이디
            console.log(`${userId} Id Failed at ${new Date()}`)
            res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
            res.write(`존재하지 않는 아이디입니다.`)
            res.write(`<div><p><a href="/login">Login</a></p></div>`)
            res.write(`<div><p><a href="/">HOME</a></p></div>`)
            res.end()
        } else {
            let user = results[0]
            crypto.pbkdf2(password, user.salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, derivedKey) => {
                if (err) throw err
                if (derivedKey.toString('base64') === user.Password) {
                    console.log(`${results[0].UserId} Login Success at ${new Date()}`)
                    res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                    res.write("Login Success")
                    res.write(`<div><p><a href="/">HOME</a></p></div>`)
                    res.end()
                } else {
                    console.log(`${results[0].UserId} Password Failed at ${new Date()}`)
                    res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                    res.write("Please check your password.")
                    res.write(`<div><p><a href="/login">Login</a></p></div>`)
                    res.write(`<div><p><a href="/">HOME</a></p></div>`)
                    res.end()
                }
            })
        }
    })
}