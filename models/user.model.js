import mongoose  from "mongoose";

const userSchema = new mongoose.Schema(definition:{
    name:{
        type: String,
        required: [true,'User Name is required'],
        trim:true,
        minlenght:2,
        maxlength:50,
    },
    email:{
        type: String,
        required: [true,'User email is required'],
        trim:true,
        unique:true,
        lowercase:true,
        match:[/\S+@\S+\.\S+/,'Please fill a valid email address']
},
    password:{
        type: String,
        required: [true,'User password is required'],
        trim:true,
        minlenght:6,
        maxlength:50,
}
}, {timestamps:true});

const User = mongoose.model('User',userSchema);

export default User;
