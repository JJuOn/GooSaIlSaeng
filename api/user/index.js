const express=require('express')
const router=express.Router()
const everytime=require('./everytime')
const login = require('./login')
const signup = require('./signup')
const mypage = require('./mypage')
const modify = require('./modify')

router.post('/everytime', everytime.Everytime )
router.post('/login', login.Login)
router.post('/signup', signup.Signup)
router.get('/mypage', mypage.Mypage)
router.post('/modify', modify.Modify)

module.exports=router