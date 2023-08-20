const mongoose = require('mongoose')
const bcrypt=require('bcrypt');

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Cannot be blank"],
        unique:true,
    },
    password:{
        type:String,
        required: true,
    },
    newMessages:{
        type:Object,
        default:{}
    },
    followers:{
        type:Object,
        default:{}
    }
});

UserSchema.methods.toJson=function(){
    const user=this
    const userObject=user.toObject();
    return userObject;
}

UserSchema.statics.findByCredentials=async function(name){
    const user=await User.findOne({name});
    return user;
}

const User= mongoose.model('User',UserSchema);
module.exports = User
