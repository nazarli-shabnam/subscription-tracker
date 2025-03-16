import {Router} from 'express';
import { signIn,signUp,signOut } from '../controllers/auth.controller.js';

const authRouter=Router();

//Path:/api/v1/auth
authRouter.post('/sign-in',signIn);
authRouter.post('/sign-up',signUp);
authRouter.post('/sign-out', signOut);

export default authRouter;