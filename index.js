const express = require('express');
const app =express();
const router = require('express').Router();
const cors = require('cors');
const mongoose = require('mongoose');
const user = require('./routes/auth');
const User = require('./models/User');
const Message = require('./models/message');
const Follow = require('./models/Following');

require('dotenv').config();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());
app.use('/api',user);
const rooms =['Tweet Page']; 
const server = require('http').createServer(app);


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const io= require('socket.io')(server,{
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

    socket.on('tweet-room',async()=>{
      let posts=await getLastPosts();
      posts = sortPostsByDate(posts);
      socket.emit('receive-posts',posts);
   })

   socket.on('post-room',async(content,sender,time,date)=>{
    const newPosts = await Message.create({content,from:sender,time,date});

    let posts=await getLastPosts();
    posts = sortPostsByDate(posts);
    io.emit('receive-posts', posts);
   })

   socket.on('edit-post',async(postId,editContent)=>{
    await Message.findByIdAndUpdate(postId,{content:editContent});
    let posts=await getLastPosts();
    posts = sortPostsByDate(posts);
    io.emit('receive-posts', posts);
   })

   socket.on('delete-post',async(postId)=>{
    await Message.findByIdAndDelete(postId);
    let posts = await getLastPosts();
    posts=sortPostsByDate(posts);
    io.emit('receive-posts', posts);
   });

   socket.on('new-follow',async()=>{
    const follows = await Follow.find();
    io.emit('new-follow',follows);
   })
   socket.on('follow-user', async (followerId, followeeId) => {
    try {
      const existingFollow = await Follow.findOne({ id: followerId, username: followeeId });
  
      if (existingFollow) {
        await Follow.findByIdAndDelete(existingFollow._id);
      } else {
        await Follow.create({ id: followerId, username: followeeId });
      }

      const followers = await Follow.find({ username: followeeId });
      io.emit('update-followers', followers);
    } catch (error) {
      console.error('Error during follow/unfollow:', error);
    }
  });
  


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
   });
    
})

const port = process.env.PORT || 5001;
server.listen(port, () => {
    console.log(`Socket.IO server listening on port ${port}`);
});
  
  module.exports = server;
  