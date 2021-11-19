require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./dbModel')
const cors = require('cors');
const passport = require('passport')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const {initHeaderPassport} = require('./initHeaderPassport');
const bcrypt = require('bcrypt');

const server = express();

mongoose.connect(process.env.DATABASE_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).
then(() => console.log("Connected to mongoDb"))
.catch(err => console.log(err.message))

server.use(express.json())
server.use(express.urlencoded({extended: true}));
const corsOptions ={
    origin: `http://localhost:3000`, 
    credentials: true,           
    optionSuccessStatus: 200
  }
server.use(cors(corsOptions))
server.use(cookieParser());
server.use(passport.initialize());
//server.use(passport.session());
initHeaderPassport(passport);

server.post('/register', async(req,res)=>{
    const {username, password, first_name, last_name} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await User.findOne({username: username}, {returnOriginal: true})
    if(!result){
        const newUser = new User({
            username: username,
            password: hashedPassword,
            first_name: first_name,
            last_name: last_name,
        });
        await newUser.save({new:true}, async(err,success)=>{
            if(err) return res.status(400).json({message: err.message})
            else if(success) return res.status(201).json({message:'user created', status:true})
        })
    }
    else if(result) return res.status(401).json({message: 'User exist!', status:false});
})

server.put('/renew/access-token', async(req, res)=>{
    const refreshToken = req.body.token;
    if(!refreshToken) return res.status(401).json({message: 'Unauthorized', status: false});
    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY);
    const result = await User.findById({_id: decoded.payload.user_id}, {new:true});
    const payload = {user_id: result._id};
    const accessToken = jwt.sign({payload}, process.env.SECRET_KEY, {expiresIn: '2m'});
    return res.status(201).json({accessToken: accessToken, status:true});
})

server.get('/user', passport.authenticate('jwt', {session: false}), async(req, res)=>{
    const user_id = req.user.payload.user_id;
    try{
        const result = await User.findById({_id: user_id}, {new:true});
        return res.status(200).json({message: 'Authorized', user: result})
    }catch(err){
        return res.status(500).json({message: err.message})
    }
});

server.post('/refresh-token', async(req, res)=>{
    const refreshToken = req.body.token;
    if(!refreshToken) return res.status(403).json({message: 'Forbidden', status: false});
    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY, (err, success)=>{
        if(err) return res.status(500).json({message: err.message});
        else if(success){
            return res.status(200).json({message: 'Authorized',status:true});
        }
    });
    
})

server.post('/login', async(req,res)=>{
   const {username, password} = req.body;

   const result = await User.findOne({username: username}, {returnOriginal: false});
   if(result){
    const isMatch = await bcrypt.compare(password, result.password);
     if(isMatch){
         const user_id = result._id;
         const payload = {user_id: user_id};
         const accessToken = jwt.sign({payload}, process.env.SECRET_KEY, {expiresIn: '2m'});
         const refreshToken = jwt.sign({payload}, process.env.SECRET_KEY, {expiresIn: '3d'});
         return res.status(200).json({accessToken: accessToken, refreshToken: refreshToken, status:true});
     }
     else return res.status(404).json({message: "password incorrect!", status:false})
   }
   else if(!result){
      return res.status(404).json({message: 'User not found!', status:false})
   }
});

server.listen(process.env.PORT,()=>{
    console.log(`listening on PORT=${process.env.PORT}`)
})