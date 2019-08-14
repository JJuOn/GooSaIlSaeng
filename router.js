const fs=require('fs')
const express=require('express')
const router=express.Router()

router.get('/',(req,res)=>{
    if(!req.session.user){
        res.redirect('/login')
    }
    else{
        res.redirect('/main')
    }
})

router.get('/login',(req,res)=>{
    fs.readFile('./static/html/login.html',(err,data)=>{
        if(err){
            throw err
        }
        res.end(data)
    })
})

router.get('/signup',(req,res)=>{
    fs.readFile('./static/html/signup.html',(err,data)=>{
        if(err){
            throw err
        }
        res.end(data)
    })
})

router.get('/main',(req,res)=>{
    if(!req.session.user){
        res.redirect('/login')
    }
    fs.readFile('./static/html/main.html',(err,data)=>{
        if(err){
            throw err
        }
        res.end(data)
    })
})

router.get('/pw_modify',(req,res)=>{
    if(!req.session.user){
        res.redirect('/login')
    }
    fs.readFile('./static//html/pw_modify.html',(err,data)=>{
        if(err){
            throw err
        }
        res.end(data)
    })
})
module.exports=router