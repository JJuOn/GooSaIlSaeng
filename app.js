const mysql = require('mysql')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const crypto = require('crypto')
require('dotenv').config()

const app = express()

const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
})
db.connect()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.write(`
    <!DOCTYPE html>
    <html>
        <head>
            <title>HOME</title>
        </head>
        <body> 
            <p><a href="/signup">Sign Up</a></p>
            <p><a href="/login">Login</a></p>
        </body>
    </html>
    `)
    res.end()
})

app.get('/login', (req, res) => {
    fs.readFile('./login.html', (err, data) => {
        if (err) throw err
        res.writeHead('200', {'Content-Type': 'text/html' })
        res.end(data);
    })
})

app.post('/login', (req, res) => {
    const status = req.body.status
    const userId = req.body.userid
    const password = req.body.password
    
    if (status === 'student') {
        db.query(`SELECT * FROM Student where UserId=?`, [userId], (err, results) => {
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
    } else if (status === 'faculty') {
        db.query(`SELECT * FROM Faculty where UserId=?`, [userId], (err, results) => {
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
})

app.get('/signup', (req, res) => {
    fs.readFile('./signup.html', (err, data) => {
        if (err) throw err
        res.writeHead('200', {'Content-Type': 'text/html' })
        res.end(data);
    })
})

app.post('/signup', (req, res) => {
    const status = req.body.status
    const numId = req.body.numId
    const name = req.body.name
    const userId = req.body.userid
    const password = req.body.password

    if (status === 'student') {
        db.query(`SELECT * FROM Student where NumId=? || UserId=?`, [numId, userId], (err, results) => {
            if (err) throw err;
            if (results[0]) {       // 이미 존재하는 학번 또는 아이디
                res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                res.write(`입력하신 학번 또는 아이디로 가입된 계정이 이미 존재합니다.`)
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
                        db.query(`INSERT INTO Student (NumId, Name, UserId, Password, created, salt) VALUES (?, ?, ?, ?, NOW(), ?)`, [numId, name, userId, derivedKey, salt], (err, result) => {
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
    }
})

app.listen(3000, () => console.log("Listening on port 3000!"))