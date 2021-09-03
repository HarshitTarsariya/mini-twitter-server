import mongoose from 'mongoose';

const {Schema} = mongoose;

//tweet schema
const tweet = new Schema({
    user:String,        //userid autogenerated in user collection by mongo
    time:String,        // Time of tweet
    tweet:String,        //Text
    username:String
});

export default mongoose.model('tweets',tweet);