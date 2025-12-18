import nodemailer from 'nodemailer';

import { EMAIL_PASSWORD, EMAIL_USER } from './env.js'

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  throw new Error('EMAIL_USER and EMAIL_PASSWORD must be defined in environment variables');
}

export const accountEmail = EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
})

export default transporter;