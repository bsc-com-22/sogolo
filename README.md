# Sogolo -- Social Commerce Trust & Escrow Platform

### *Safe Transactions for Buyers & Sellers on Social Media*

## Overview

Sogolo is a social commerce trust and escrow service that makes buying
and selling on platforms like Facebook Marketplace, WhatsApp, and
Instagram safe. It verifies sellers, confirms product authenticity, and
holds payments securely until delivery is confirmed.

## Core Features

-   Deal Verification
-   Escrow Payments
-   Seller Product Submission
-   Transaction Tracking
-   Shareable Verification Links
-   Secure Storage
-   Notifications
-   Admin Dashboard

## Tech Stack

**Frontend:** HTML, CSS, JavaScript\
**Backend:** Supabase (Auth, DB, Storage, Edge Functions)\
**Payments:** Paychangu

## Database Structure

-   users\
-   products\
-   transactions\
-   verifications\
-   payments

## How It Works

1.  Buyer Creates Verification\
2.  Seller Fills Verification Form\
3.  Buyer Makes Payment\
4.  Product Verified\
5.  Funds Released

## Project Structure

    /sogolo
    ├── public/
    ├── src/
    ├── database/
    ├── supabase/
    └── README.md

## Environment Variables

    SUPABASE_URL=
    SUPABASE_ANON_KEY=
    PAYCHANGU_SECRET_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

## Development Setup

    git clone https://github.com/yourname/sogolo.git
    cd sogolo
    npm install
    npm run dev

## License

MIT License.
