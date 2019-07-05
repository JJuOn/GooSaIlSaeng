const express = require('express')
const router = express.Router()

router.use('/api', require('./api'))
router.use('/', (req, res) => {
    res.write(`
    <!DOCTYPE html>
    <html>
        <head>
            <title>HOME</title>
        </head>
        <body> 
            <p><a href="/html/signup.html">Sign Up</a></p>
            <p><a href="/html/login.html">Login</a></p>
        </body>
    </html>
    `)
    res.end()
})

module.exports = router