# Subscription Tracker API

A Node.js REST API for tracking and managing subscriptions with automated email reminders before renewal dates.

## About This Project

**Subscription Tracker** is a comprehensive backend API solution designed to help individuals and businesses keep track of their recurring subscriptions and services. Whether you're managing personal subscriptions like Netflix, Spotify, or gym memberships, or tracking business SaaS subscriptions, this API provides a centralized system to monitor, organize, and never miss a renewal date.

### What Can You Do With This Project?

1. **Track Multiple Subscriptions**

   - Add subscriptions with details like name, price, currency, frequency (daily, weekly, monthly, yearly), and payment method
   - Organize subscriptions by categories (sports, news, entertainment, lifestyle, technology, finance, politics, or other)
   - Monitor subscription status (active, cancelled, expired)

2. **Never Miss a Renewal**

   - Automatically receive email reminders at strategic intervals (7, 5, 2, and 1 days before renewal)
   - Get notified before your subscription renews so you can decide whether to continue or cancel
   - Track renewal dates and payment methods for each subscription

3. **User Management**

   - Secure user registration and authentication using JWT tokens
   - Each user can only access their own subscriptions
   - Password-protected accounts with secure password hashing

4. **Automated Workflows**

   - Leverages Upstash QStash for reliable, scheduled email delivery
   - Workflows automatically handle reminder scheduling when subscriptions are created
   - Smart reminder system that only sends notifications for active subscriptions

5. **Security & Performance**
   - Built-in rate limiting to prevent abuse
   - Bot detection to protect your API
   - Input validation to ensure data integrity
   - Secure authentication and authorization

### Use Cases

- **Personal Finance Management**: Track all your monthly subscriptions in one place and avoid surprise charges
- **Budget Planning**: Monitor subscription costs and identify opportunities to reduce spending
- **Business Expense Tracking**: Keep track of SaaS subscriptions and software licenses for your company
- **Subscription Auditing**: Review and manage subscriptions before they auto-renew
- **Family Account Management**: Centralize family subscription tracking

### Key Benefits

- ✅ **Automated Reminders**: Never forget a renewal date with automated email notifications
- ✅ **Multi-Currency Support**: Track subscriptions in USD, EUR, or GBP
- ✅ **Flexible Frequencies**: Support for daily, weekly, monthly, and yearly subscriptions
- ✅ **Category Organization**: Easily categorize and filter subscriptions
- ✅ **Secure & Scalable**: Built with security best practices and modern architecture
- ✅ **RESTful API**: Easy to integrate with frontend applications or mobile apps

## Features

- 🔐 User authentication (JWT-based)
- 📦 Subscription management (create, view subscriptions)
- 📧 Automated email reminders (7, 5, 2, and 1 days before renewal)
- 🛡️ Security features (Arcjet rate limiting and bot detection)
- ⏰ Workflow-based reminder system using Upstash QStash

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (local instance or MongoDB Atlas account)
- **npm** or **yarn** package manager

## Required Services

You'll need accounts for the following services:

1. **MongoDB** - Database storage
2. **Arcjet** - Security and rate limiting
3. **Upstash QStash** - Workflow orchestration for email reminders
4. **Gmail** (or email service) - For sending reminder emails

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd subscription-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create environment files based on your environment:

   For **development**, create `.env.development.local`:

   ```env
   PORT=3000
   NODE_ENV=development
   SERVER_URL=http://localhost:3000

   # MongoDB Connection
   DB_URI=mongodb://localhost:27017/subscription-tracker
   # Or use MongoDB Atlas:
   # DB_URI=mongodb+srv://username:password@cluster.mongodb.net/subscription-tracker

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Arcjet Configuration
   ARCJET_ENV=development
   ARCJET_KEY=your-arcjet-api-key

   # Upstash QStash Configuration
   QSTASH_TOKEN=your-qstash-token
   QSTASH_URL=https://qstash.upstash.io/v2

   # Email Configuration (Gmail)
   EMAIL_PASSWORD=your-gmail-app-password
   ```

   For **production**, create `.env.production.local` with production values.

   **Note**: The app loads environment variables from `.env.{NODE_ENV}.local` files.

4. **Set up MongoDB**

   - **Option 1: Local MongoDB**

     - Install MongoDB locally
     - Start MongoDB service
     - Update `DB_URI` in your `.env` file

   - **Option 2: MongoDB Atlas**
     - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Create a cluster
     - Get your connection string
     - Update `DB_URI` in your `.env` file

5. **Set up Arcjet**

   - Sign up at [Arcjet](https://arcjet.com)
   - Get your API key
   - Add it to `ARCJET_KEY` in your `.env` file

6. **Set up Upstash QStash**

   - Sign up at [Upstash](https://upstash.com)
   - Create a QStash project
   - Get your QStash token and URL
   - Add them to `QSTASH_TOKEN` and `QSTASH_URL` in your `.env` file

7. **Set up Gmail for email sending**

   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password:
     - Go to Google Account settings
     - Security → 2-Step Verification → App passwords
     - Generate a password for "Mail"
   - Add the app password to `EMAIL_PASSWORD` in your `.env` file
   - **Note**: The sender email is hardcoded in `config/nodemailer.js`. Update it if needed.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with `nodemon` for automatic restarts on file changes.

### Production Mode

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

Visit `http://localhost:3000` to see the welcome message.

## API Endpoints

### Authentication

- `POST /api/v1/auth/sign-up` - Register a new user
- `POST /api/v1/auth/sign-in` - Sign in existing user
- `POST /api/v1/auth/sign-out` - Sign out (logout)

### Users

- `GET /api/v1/users` - Get all users (no auth required)
- `GET /api/v1/users/:id` - Get user by ID (auth required)

### Subscriptions

- `POST /api/v1/subscriptions` - Create a new subscription (auth required)
- `GET /api/v1/subscriptions/user/:id` - Get all subscriptions for a user (auth required)

### Workflows

- `POST /api/v1/workflows/subscriptions/reminder` - Internal endpoint for workflow reminders

## Example API Usage

### Sign Up

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Sign In

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Subscription (with auth token)

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Netflix",
    "price": 15.99,
    "currency": "USD",
    "frequency": "monthly",
    "category": "entertainment",
    "paymentMethod": "Credit Card ending in 1234",
    "startDate": "2024-01-01"
  }'
```

## Project Structure

```
subscription-tracker/
├── app.js                 # Main application entry point
├── config/                # Configuration files
│   ├── arcjet.js         # Arcjet security configuration
│   ├── env.js            # Environment variables
│   ├── nodemailer.js     # Email transporter setup
│   └── upstash.js        # Upstash workflow client
├── controllers/          # Request handlers
│   ├── auth.controller.js
│   ├── subscription.controller.js
│   ├── user.controller.js
│   └── workflow.controller.js
├── database/             # Database connection
│   └── mongodb.js
├── middlewares/          # Express middlewares
│   ├── arcjet.middleware.js
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/               # Mongoose models
│   ├── subscription.model.js
│   └── user.model.js
├── routes/               # API routes
│   ├── auth.routes.js
│   ├── subscription.routes.js
│   ├── user.routes.js
│   └── workflow.routes.js
└── utils/                # Utility functions
    ├── email-template.js
    └── send-email.js
```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending
- **Arcjet** - Security and rate limiting
- **Upstash QStash** - Workflow orchestration
- **dayjs** - Date manipulation

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting via Arcjet
- Bot detection via Arcjet
- Input validation via Mongoose schemas

## Email Reminders

The system automatically sends email reminders:

- 7 days before renewal
- 5 days before renewal
- 2 days before renewal
- 1 day before renewal

Reminders are scheduled using Upstash QStash workflows when a subscription is created.

## Troubleshooting

### Database Connection Issues

- Ensure MongoDB is running (if using local instance)
- Verify `DB_URI` is correct in your `.env` file
- Check MongoDB Atlas IP whitelist (if using Atlas)

### Email Not Sending

- Verify Gmail app password is correct
- Check that 2FA is enabled on Gmail account
- Ensure `EMAIL_PASSWORD` is set correctly

### Workflow Not Triggering

- Verify `QSTASH_TOKEN` and `QSTASH_URL` are correct
- Check that `SERVER_URL` matches your server's accessible URL
- Ensure the server is accessible from the internet (for production)

## License

This project is private and not licensed for public use.
