const mongoose=require('mongoose');

const FollowSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    }
})

const Follow = mongoose.model('Follow',FollowSchema);
module.exports = Follow