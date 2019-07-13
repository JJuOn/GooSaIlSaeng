const express=require('express')
const router=express.Router()
const setAll=require('./setAll')

router.post('/setall', setAll.SetAll)

module.exports=router