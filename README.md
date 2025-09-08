# ALX Poll

A modern, secure polling application built with Next.js and Supabase. Create interactive polls, share them via QR codes, and enable users to vote and engage with the content.

## Features

- **🔐 Multiple Authentication Methods**
  - Traditional email/password login
  - **Magic Link Authentication** - Login with a secure link sent to your email
  - **QR Code Login** - Scan a QR code to authenticate instantly
- **📊 Interactive Polls** - Create and manage polls with multiple options
- **🔒 Security-First Design** - Input validation, rate limiting, and audit logging
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **⚡ Real-time Updates** - Live poll results and voting

## Magic Link & QR Code Authentication

This application features a passwordless authentication system:

### Magic Link Login
1. Visit the login page and select the "Magic Link" tab
2. Enter your email address
3. Click "Generate Magic Link & QR Code"
4. Check your email for the secure login link
5. Click the link in your email to be automatically signed in!
6. Alternatively, scan the QR code to go to the login page with your email pre-filled

### How it Works
- **Supabase OTP**: Uses Supabase's built-in One-Time Password (OTP) system for security
- **Email Delivery**: Secure magic links are sent directly to your email
- **Time-Limited**: Links expire after 1 hour for security
- **QR Code Convenience**: QR codes link to the login page with email pre-filled

### Security Features
- Rate limiting on magic link generation (3 requests per 15 minutes)
- Automatic cleanup of expired links
- CSRF protection and input validation
- Audit logging for all authentication events

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Setup

Magic link authentication uses Supabase's built-in OTP system, so no additional database setup is required beyond the standard polls and user tables.

## Environment Variables

Make sure to set up the following environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## API Endpoints

- `POST /api/auth/magic-link/generate` - Generate a magic link email and QR code
- `POST /api/polls` - Create a new poll
- `GET /api/polls` - Fetch all polls with optional filtering

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI, Radix UI
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth with custom magic links
- **Database**: PostgreSQL (via Supabase)
- **QR Codes**: qrcode library
- **Security**: Zod validation, rate limiting, CSRF protection
