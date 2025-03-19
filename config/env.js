import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const { PORT, NODE_ENV,SERVER_URL,
    DB_URI, JWT_SECRET,JWT_EXPIRES_IN,
    ARCJET_ENV,ARCJET_KEY,
    QSTASH_TOKEN,QSTASH_URL,
    EMAIL_PASSWORD
}=process.env;

