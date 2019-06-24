const express=require('express')
const router=express.Router()
const everytime=require('./everytime')

router.post('/everytime', everytime.Everytime )

module.exports=router