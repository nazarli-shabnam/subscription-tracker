import express from 'express';
import cookieParser from 'cookie-parser';

import {PORT} from './config/env.js';

import userRouter from './routes/user.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import authRouter from './routes/auth.routes.js';
import connectToDatabase from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());


app.use('/api/v1/auth',authRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/subscriptions',subscriptionRouter);

app.use(errorMiddleware);

app.get('/',(req,res)=>{
    res.send('Welcome to the Subscription Tracker API');
})
app.listen(PORT,async ()=>{
    console.log(`server started at http://localhost:${PORT}`);

    await connectToDatabase();
});

export default app;