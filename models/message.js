const mongoose = require('mongoose');

const MessageSchema = new  mongoose.Schema({
    content:String,
    from: Object,
    socketid: String,
    time: String,
    date: String
})

const Message = mongoose.model('Message', MessageSchema);
module.exports=Message; 