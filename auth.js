import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import _ from 'lodash';

export const createTokens=async(user,secret,secret2)=>{
    const  createToken=jwt.sign(
        {
            user:_.pick(user,['_id','username']),
        },
        secret,
        {
            expiresIn: '1h',
        },
    );

    const createRefreshToken=jwt.sign(
        {
            user:_.pick(user,['_id','username']),
        },
        secret2,
        {
            expiresIn: '10d',
        },
    );

    return [createToken, createRefreshToken];
};

export const refreshTokens=async(token,refreshToken,userORM,secret,secret2)=>{
    let userId=-1;
    try{
        const {user:{_id}} = jwt.decode(refreshToken);
        userId=id;
    }catch(err){
        return {};
    }

    if(!userId){
        return {};
    }
    const user=await userORM.findOne({where:{_id:userId}});

    if(!user){
        return {};
    }
    const refreshSecret=user.password+secret2;
    try{
        jwt.verify(refreshToken,refreshSecret);
    }catch(err){
        return {};
    }

    const [newToken,newRefreshToken]=await createTokens(user,secret,refreshSecret);

    return{
        token:newToken,
        refreshToken:newRefreshToken,
        user,
    };
};


