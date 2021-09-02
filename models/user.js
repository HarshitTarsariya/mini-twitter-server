import mongoose from 'mongoose';

const {Schema} = mongoose;

const user = new Schema({
    username:String,        //username by user
    password:String,        
    following:[]            //id's of user followed by current user
});

export default mongoose.model('users',user);