const express=require('express')
const router=express.Router()
const everytime=require('./everytime')
const login = require('./login')
const signup = require('./signup')

router.post('/everytime', everytime.Everytime )
router.post('/login', login.Login)
router.post('/signup', signup.Signup)

module.exports=router