const crypto = require('crypto')
const mysql = require('mysql')
const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
})
db.connect()

exports.Signup = (req, res) => {
    const status = req.body.status
    const numId = req.body.numId
    const name = req.body.name
    const userId = req.body.userid
    const password = req.body.password

    db.query(`SELECT * FROM ${status} where NumId=? || UserId=?`, [numId, userId], (err, results) => {
        if (err) throw err;
        if (results[0]) {       // 이미 존재하는 학번/사번 또는 아이디
            res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
            res.write(`입력하신 학번/사번 또는 아이디로 가입된 계정이 이미 존재합니다.`)
            res.write(`<div><p><a href="/login">Login</a></p></div>`)
            res.write(`<div<p><a href="/signup">Sign Up</a></p></div>`)
            res.write(`<div><p><a href="/">HOME</a></p></div>`)
            res.end()
        } else {
            crypto.randomBytes(64, (err, buf) => {
                if (err) throw err;
                let salt = buf.toString('base64')
                crypto.pbkdf2(password, salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, key) => {
                    derivedKey = key.toString('base64')
                    db.query(`INSERT INTO ${status} (NumId, Name, UserId, Password, created, salt) VALUES (?, ?, ?, ?, NOW(), ?)`, [numId, name, userId, derivedKey, salt], (err, result) => {
                        if (err) throw err
                        res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                        res.write(`<p>${name}(${userId})님, 회원가입을 환영합니다!</p>`)
                        res.write(`<p><a href="/">HOME</a></p>`)
                        res.write(`<p><a href="login">Login</a></p>`)
                        res.end()
                    })
                })
            })
        }
    })

    /*if (status === 'student') {
        
    } else if (status === 'faculty') {
        db.query(`SELECT * FROM Faculty where NumId=? || UserId=?`, [numId, userId], (err, results) => {
            if (err) throw err;
            if (results[0]) {       // 이미 존재하는 사번 또는 아이디
                res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                res.write(`입력하신 사번 또는 아이디로 가입된 계정이 이미 존재합니다.`)
                res.write(`<div><p><a href="/login">Login</a></p></div>`)
                res.write(`<div<p><a href="/signup">Sign Up</a></p></div>`)
                res.write(`<div><p><a href="/">HOME</a></p></div>`)
                res.end()
            } else {
                crypto.randomBytes(64, (err, buf) => {
                    if (err) throw err;
                    let salt = buf.toString('base64')
                    crypto.pbkdf2(password, salt, Number(process.env.CRYPTO_ITERATION), 64, 'sha512', (err, key) => {
                        derivedKey = key.toString('base64')
                        db.query(`INSERT INTO Faculty (NumId, Name, UserId, Password, created, salt) VALUES (?, ?, ?, ?, NOW(), ?)`, [numId, name, userId, derivedKey, salt], (err, result) => {
                            if (err) throw err
                            res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                            res.write(`<p>${name}(${userId})님, 회원가입을 환영합니다!</p>`)
                            res.write(`<p><a href="/">HOME</a></p>`)
                            res.write(`<p><a href="login">Login</a></p>`)
                            res.end()
                        })
                    })
                })
            }
        })
    }*/
}