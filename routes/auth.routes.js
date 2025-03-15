import {Router} from 'express';

const authRouter=Router();

authRouter.post('/sign-up', (req, res) => res.send({title:"Sign-up"}));
authRouter.post('/sign-out', (req, res) => res.send({title:"Sign-out"}));

export default authRouter;