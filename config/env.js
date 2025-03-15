import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const { PORT, NODE_ENV,DB_URL } = process.env;

// export default {PORT, NODE_ENV};