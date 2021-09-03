import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {createTokens,refreshTokens} from './auth.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import user from './models/user.js';
import tweet from './models/tweet.js';

const secret="qewrsadwfawfgea";
const secret2="grhawd51222vu";

const mon = mongoose;
mon.Promise = global.Promise;
mon.connect("mongodb://localhost:27017/TwitterDB",{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>{
    console.log('------Connected to Mongodb------');
}).catch(error => {
    console.log("------Error connecting Mongodb------");
})

const app=express();
const port = 3000;
app.listen(port, function() {
    console.log('Started listening on port ' + port);
});

app.use(cors('*'));
app.use(bodyParser.json());


const userORM= user;
const tweetORM = tweet;

const checkUser=async (req,res,next)=>{
    const token= req.headers['x-token'];

    if(token){

        try{
            const {user} = jwt.verify(token,secret);
            req.user=user;

        }catch(err){
            const refreshToken=req.headers['x-refresh-token'];
            const newTokens=await refreshTokens(token,refreshToken,userORM,secret,secret2);
            if(newTokens.token && newTokens.refreshToken){
                res.append('Access-Control-Expose-Headers','*');
                res.append('x-token',newTokens.token);
                res.append('x-refresh-token',newTokens.refreshToken);
            }
            req.user=newTokens.user;
        }
    }
    next();
};

app.use(checkUser);

app.post('/register',async(req,res)=>{
    const hashedPassword=await bcrypt.hash(req.body.password,12);
    var tmp_user=new userORM({
        'username':req.body.username,
        'password':hashedPassword
    });

    tmp_user.save((err,data)=>{
        if(err) res.status(400).json({auth:false,message:'Internal Server Error'});
        else    res.status(200).json({auth:true,message:'Registered Successfully'});
    });
});

app.post('/login',async(req,res)=>{
    const username=req.body.username,password=req.body.password;
    const user=await userORM.findOne({username:username});

    if(!user){
        return res.json({auth:false,path:'username',message:'Invalid Username'}); 
    }
    
    const validPassword=await bcrypt.compare(password,user.password);
    if(!validPassword){
        return res.json({auth:false,path:'password',message:'Invalid Password'});
    }

    const refreshTokenSecret=user.password+secret2;
    const [token,refreshToken]=await createTokens(user,secret,refreshTokenSecret);


    res.status(200)
        .json({auth:true,token:token,refreshToken:refreshToken});

}); 
const verify=(req,res,next)=>{
    if(!req.user)    return res.json({auth:false,path:'notoken'});
    else    next();
}
app.post('/tweet',verify,(req,res)=>{

    const d=new Date();
    let tmp_tweet=new tweetORM({
        user:req.user._id,
        tweet:req.body.tweet,
        time:d.getTime().toString(),
        username:req.user.username
    });
    
    tmp_tweet.save((err,data)=>{
        if(err) res.status(400).json({auth:false,message:'Internal Server Error'});
        else    res.status(200).json({auth:true,message:'Tweet Successfully'});
    });
});

app.get('/tweets',verify,async(req,res)=>{
    let Tweets=[];
    tweetORM.find({id:req.user._id},(err,data)=>{
        if(err) res.status(400).json({auth:false,message:'Internal Server Error'});
        else    res.status(200).json({auth:true,tweets:data});
    });
});






