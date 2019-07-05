const express = require('express')
const bodyParser = require('body-parser')
const path=require('path')
require('dotenv').config()

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname, 'api/user')))
app.use('/', require('./'))

app.listen(80, () => console.log("Listening on port 80!"))