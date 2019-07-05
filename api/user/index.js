const express=require('express')
const router=express.Router()
const everytime=require('./everytime')
const login = require('./login')
const signup = require('./signup')

router.post('/everytime', everytime.Everytime )
router.post('/login_process', login.Login)
router.post('/signup_process', signup.Signup)

module.exports=router