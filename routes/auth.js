const express=require('express');
const router = express.Router();
const User= require('../models/User');
const {body,validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const fetchuser=require('../middleware/fetchuser');
const jwt = require('jsonwebtoken');

const JWT_SECRET=process.env.JWT_TOKEN;


//Creating a User
router.post('/createuser',[
    body('name',"Enter a valid name").isLength({min:3}),
    body('password',"Password should be of atleast 5 characters").isLength({min:5}),
],async(req,res)=>{
    let success= false;
    const errors = validationResult(req, res);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array()});
    }

    try{
        const { name, password } = req.body;
        let user=await User.findOne({name});
        if(user){
            return res.status(400).json({success,error:"Sorry a user with this name already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const secPass= await bcrypt.hash(password, salt);
        user = await User.create({
            name:name,
            password:secPass
        })
        const data ={
            user:{
                id:user.id,
            }
        }
        const authToken=jwt.sign(data,process.env.JWT_TOKEN);
        success= true;
        res.json({success,authToken})
    }
    catch(error){
        console.error(error.message);
        res.status(500).json("Internal Server Error");
    }
})


//Logged in user
router.post('/login',[
    body('name','Name cannot be blank').exists(),
    body('password','Password cannot be blank').exists(),
],async(req,res)=>{
    let success=false;
    const errors = validationResult(req, res);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {name,password}=req.body;
    try{
        let user=await User.findOne({name:name});
        if(!user){
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }
        const passwordCompare=await bcrypt.compare(password,user.password);
        if(!passwordCompare){
            success=false;
            return res.status(400).json({success,error:"Please try to login with correct credentials"});
        }
        const data={
            user:{
                id:user.id
            }
        }
        const authtoken=jwt.sign(data,process.env.JWT_TOKEN)
        success=true;
        res.json({success,authtoken})
    }
    catch(error){
        console.error(error.message);
        res.status(500).json("Internal Server Error");
    }
})

module.exports= router