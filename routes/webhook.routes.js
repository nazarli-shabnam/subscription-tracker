import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook
} from '../controllers/webhook.controller.js';

const webhookRouter = Router();

webhookRouter.get('/', authorize, getWebhooks);
webhookRouter.get('/:id', authorize, getWebhookById);
webhookRouter.post('/', authorize, createWebhook);
webhookRouter.put('/:id', authorize, updateWebhook);
webhookRouter.delete('/:id', authorize, deleteWebhook);

export default webhookRouter;

