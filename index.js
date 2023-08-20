const express = require('express');
const app =express();
const router = require('express').Router();
const cors = require('cors');
const mongoose = require('mongoose');
const user = require('./routes/auth');
const User = require('./models/User');
const Message = require('./models/message');

require('dotenv').config();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());
app.use('/api',user);
const rooms =['Tweet Page']; 
const server1 = require('http').createServer(app);


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const io= require('socket.io')(server1,{
    cors:{
        origin:"http://localhost:3000",
        methods:['GET','POST']
    }
})

async function getLastPosts(){
    let posts = await Message.aggregate([
        {$group: {_id:'$date', messagesByDate: {$push: '$$ROOT'}}}
    ])
    return posts;
}

function sortPostsByDate(messages){
    return messages.sort(function(a,b){
        let date1 = a._id.split('/');
        let date2 = b._id.split('/');
        date1 = date1[2] + date1[0] + date1[1];
        date2 = date2[2] + date1[0] + date1[1];

        return date1<date2?-1:1
    })
}

io.on('connection',(socket)=>{

    socket.on('new-user',async()=>{
        const members = await User.find();
        io.emit('new-user',members)
    })

    socket.on('Tweet-room',async()=>{
      let posts=await getLastPosts();
      posts = sortPostsByDate(posts);
      socket.emit('receive-posts',posts);
   })

   socket.on('post-room',async(content,sender,time,date)=>{
    const newPosts = await Message.create({content,from:sender,time,date});

    let posts=await getLastPosts();
    socket.broadcast.emit('receive-posts',posts);
   })

   app.delete('/logout',async(req,res)=>{
    try{
        const {_id,newMessages}=req.body;
        const user = await User.findById(_id);
        user.newMessages=newMessages;
        await user.save();
        const members= await User.find();
        socket.broadcast.emit('new-user',members);
        res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        res.status(400).send();
    }
   })
    
})

const server = app.listen(process.env.PORT || 5001, () => {
    console.log('Server listening on port 5001');
  });
  
  module.exports = server;
  