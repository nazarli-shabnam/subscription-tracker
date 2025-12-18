import { Router } from 'express';

import authorize from '../middlewares/auth.middleware.js'
import { getUser, getUsers } from '../controllers/user.controller.js'
import { getBudget, setBudget } from '../controllers/budget.controller.js'
import { getNotificationPreferences, updateNotificationPreferences } from '../controllers/notification.controller.js'

const userRouter = Router();

userRouter.get('/', getUsers);

userRouter.get('/budget', authorize, getBudget);
userRouter.post('/budget', authorize, setBudget);
userRouter.put('/budget', authorize, setBudget);

userRouter.get('/notifications', authorize, getNotificationPreferences);
userRouter.put('/notifications', authorize, updateNotificationPreferences);

userRouter.get('/:id', authorize, getUser);

userRouter.post('/', (req, res) => res.send({ title: 'CREATE new user' }));

userRouter.put('/:id', (req, res) => res.send({ title: 'UPDATE user' }));

userRouter.delete('/:id', (req, res) => res.send({ title: 'DELETE user' }));

export default userRouter;