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

/*db.query("SHOW TABLES", (err, results) => {
    console.log(results)
})*/

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//app.use(express.static(`${__dirname}/login`))

/*app.use((req, res) => {
    const userId = req.body.userId
    const password = req.body.password

    res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
    res.write(`<div><p>${userId}</p></div>`)
    res.write(`<div><p>${password}</p></div>`)
    res.end(JSON.stringify(req.body, null, 2));
})*/

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
        db.query(`SELECT * FROM 학생 where 아이디=?`, [userId], (err, results) => {
            if (err) throw err;
            if (!results[0]) {
                res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                res.write(`ID doesn't exist`)
                res.write(`<div><p><a href="/">HOME</a></p></div>`)
                res.end()
            } else {
                res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
                res.write(`Exist`)
                res.write(`<div><p><a href="/">HOME</a></p></div>`)
                res.end()
            }
        })
    } else if (status === 'faculty') {
        
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
        db.query(`INSERT INTO 학생 (학번, 이름, 아이디, 비밀번호, created) VALUES (?, ?, ?, ?, NOW())`, [numId, name, userId, password], (err, result) => {
            if (err) throw err
            res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
            res.write(`<p>처리되었습니다.</p>`)
            res.write(`<p><a href="/">HOME</a></p>`)
            res.write(`<p><a href="login">Login</a></p>`)
            res.end()
        })
    } else if (status === 'faculty') {
        db.query(`INSERT INTO 교수 (사번, 이름, 아이디, 비밀번호, created) VALUES (?, ?, ?, ?, NOW())`, [numId, name, userId, password], (err, result) => {
            if (err) throw err
            res.writeHead('200', { 'Content-Type' : 'text/html; charset=utf8'})
            res.write(`<p>처리되었습니다.</p>`)
            res.write(`<p><a href="/">HOME</a></p>`)
            res.write(`<p><a href="login">Login</a></p>`)
            res.end()
        })
    }
})

app.listen(3000, () => console.log("Listening on port 3000!"))