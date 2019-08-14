const express=require('express')
const bodyParser=require('body-parser')
const session=require('express-session')
const path=require('path')
const morgan=require('morgan')
const cookieParser=require('cookie-parser')
require('dotenv').config()
const app=express()

app.use(morgan('[:date[iso]] :method :status :url :response-time(ms) :user-agent'))
app.set('view engine', 'ejs')
app.set('views', './views')
app.use('/css',express.static(path.join(__dirname,'static','css')))
app.use('/fonts',express.static(path.join(__dirname, 'static','fonts')))
app.use('/img',express.static(path.join(__dirname, 'static','img')))
app.use('/js',express.static(path.join(__dirname, 'static','js')))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
    res.header('Access-Control-Allow-Headers', 'content-type, x-access-token')
    next()
})
app.use(session({
    secret:'ambc@!vsmkv#!&*!#EDNAnsv#!$()_*#@',
    resave:false,
    saveUninitialized:true
}))

app.use('/api',require('./api'))
app.use('/',require('./router'))

app.listen(process.env.SERVER_PORT || 3000, ()=>{
    console.log('Server is running on port '+process.env.SERVER_PORT)
})