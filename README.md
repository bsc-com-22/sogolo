# Sogolo Escrow Marketplace

A secure escrow-based buyer-seller marketplace with KYC verification, transaction management, and admin oversight.

## Features

✅ **KYC Verification** - Mandatory identity verification before transactions  
✅ **Escrow System** - Funds held securely until product inspection  
✅ **Admin Oversight** - Manual verification of payments and products  
✅ **Multi-stage Tracking** - Complete visibility of transaction lifecycle  
✅ **Real-time Notifications** - Stay updated on transaction progress  
✅ **Secure Authentication** - Email/Password and Google OAuth support  

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication**: Supabase Auth (Email/Password, Google OAuth)
- **Storage**: Supabase Storage Buckets
- **Security**: Row Level Security (RLS) policies

## Prerequisites

- Supabase account ([Create one here](https://supabase.com))
- Modern web browser
- Text editor or IDE

## Setup Instructions

### 1. Database Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Copy your Supabase URL and Anon Key from Project Settings > API

3. Update `js/supabase-config.js` with your credentials:
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

4. Execute the database schema:
   - Open Supabase SQL Editor
   - Copy the contents of `database-schema.sql`
   - Execute the SQL script
   - This will create all tables, RLS policies, functions, and triggers

### 2. Storage Buckets Setup

1. Go to Supabase Dashboard > Storage

2. Create three public buckets:
   - `kyc-documents` - For ID photos and selfies
   - `product-images` - For product photos
   - `payment-proofs` - For payment proof screenshots

3. Set bucket policies (Supabase Dashboard > Storage > Policies):

   **kyc-documents:**
   - Users can upload: `auth.uid() = (storage.foldername(name))[1]::uuid`
   - Admins can view all: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`

   **product-images:**
   - Sellers can upload: `EXISTS (SELECT 1 FROM transactions WHERE id = (storage.foldername(name))[1]::uuid AND seller_id = auth.uid())`
   - Transaction participants can view: `EXISTS (SELECT 1 FROM transactions WHERE id = (storage.foldername(name))[1]::uuid AND (buyer_id = auth.uid() OR seller_id = auth.uid()))`

   **payment-proofs:**
   - Buyers can upload: `EXISTS (SELECT 1 FROM transactions WHERE id = (storage.foldername(name))[1]::uuid AND buyer_id = auth.uid())`
   - Admins can view all: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`

### 3. Authentication Setup

1. Enable Email/Password authentication:
   - Go to Authentication > Providers
   - Enable Email provider
   - Configure email templates (optional)

2. Enable Google OAuth (optional):
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Add authorized redirect URLs

### 4. Admin User Setup

After creating your first user account:

1. Go to Supabase Dashboard > Table Editor > profiles
2. Find your user record
3. Change the `role` field from `user` to `admin`
4. Save the changes

### 5. Local Development

1. Clone or download this repository

2. Open `index.html` in a web browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

3. Navigate to `http://localhost:8000`

## Project Structure

```
sogolo/
├── index.html                    # Landing page
├── login.html                    # Login/signup (to be created)
├── dashboard.html                # User dashboard (to be created)
├── admin-dashboard.html          # Admin dashboard (to be created)
├── kyc.html                      # KYC verification form (to be created)
├── transaction.html              # Transaction page (to be created)
├── css/
│   └── main.css                  # Global styles
├── js/
│   ├── supabase-config.js        # Supabase client initialization
│   ├── services/
│   │   ├── auth-service.js       # Authentication logic
│   │   ├── kyc-service.js        # KYC operations
│   │   ├── transaction-service.js # Transaction operations
│   │   ├── storage-service.js    # File upload logic
│   │   └── notification-service.js # Notifications
│   └── utils/
│       ├── validators.js         # Form validation
│       └── helpers.js            # Utility functions
├── database-schema.sql           # Complete database schema
├── API-DOCUMENTATION.md          # API reference
└── README.md                     # This file
```

## User Flows

### 1. KYC Verification

1. User signs up/logs in
2. Dashboard prompts for KYC completion
3. User fills KYC form with personal details
4. User uploads ID documents (front, back, selfie)
5. Admin reviews and approves/rejects
6. User receives notification of status

### 2. Transaction Creation (Buyer)

1. Buyer creates new transaction (requires approved KYC)
2. System generates unique transaction ID and link
3. Buyer shares link with seller

### 3. Product Submission (Seller)

1. Seller opens transaction link
2. Seller fills product details
3. Seller uploads minimum 5 product images
4. Buyer receives notification

### 4. Product Review (Buyer)

1. Buyer reviews product details and images
2. Buyer approves or requests changes
3. System displays payment instructions

### 5. Payment & Escrow

1. Buyer makes payment (bank transfer/mobile money)
2. Buyer uploads payment proof
3. Admin verifies payment
4. Funds marked as "In Escrow"

### 6. Product Delivery & Fund Release

1. Seller delivers product to office
2. Admin inspects product
3. Admin releases funds to seller
4. Transaction marked as complete

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `created` | Transaction created by buyer |
| `seller_submitted` | Seller submitted product details |
| `buyer_approved` | Buyer approved product description |
| `payment_submitted` | Buyer uploaded payment proof |
| `payment_received` | Admin confirmed payment (Escrow) |
| `product_delivered` | Seller delivered to office |
| `inspection_complete` | Admin inspected product |
| `funds_released` | Funds released to seller |
| `completed` | Transaction closed |
| `cancelled` | Transaction cancelled |
| `disputed` | Dispute raised |
| `refunded` | Buyer refunded |

## API Documentation

See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for complete API reference with code examples.

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Storage Policies**: Granular file access control
- **Input Validation**: Client and server-side validation
- **XSS Protection**: HTML sanitization
- **HTTPS Only**: Enforce secure connections in production

## Payment Methods

Currently supported payment methods:
- Bank Transfer
- Airtel Money
- TNM Mpamba

**Note**: Current implementation uses manual payment verification. For production, consider integrating automated payment gateways (Stripe, Paystack, etc.).

## Development Roadmap

### Phase 1: Core Backend ✅
- [x] Database schema
- [x] Authentication system
- [x] Service layer (KYC, Transactions, Notifications)
- [x] Utility functions

### Phase 2: User Interface (In Progress)
- [ ] Login/Signup pages
- [ ] User dashboard
- [ ] KYC form
- [ ] Transaction pages
- [ ] Admin dashboard

### Phase 3: Testing & Deployment
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

### Future Enhancements
- [ ] Automated payment integration
- [ ] Real-time chat between buyer/seller
- [ ] Dispute resolution system
- [ ] Rating and review system
- [ ] Multi-currency support
- [ ] Mobile app (React Native/Flutter)

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and Anon Key are correct
- Check if Supabase project is active
- Ensure RLS policies are properly configured

### File Upload Failures
- Verify storage buckets are created
- Check storage policies allow upload
- Ensure file size is under 5MB
- Verify file type is image (JPEG, PNG, WebP)

### Authentication Errors
- Clear browser cache and cookies
- Check if email provider is enabled in Supabase
- Verify redirect URLs for OAuth

### RLS Policy Errors
- Ensure user has proper role (user/admin)
- Check if KYC is approved for transaction operations
- Verify user is authenticated

### Admin Access Issues
- If you are not redirected to the admin dashboard, your user role might still be 'user'.
- Run the `update-admin-role.sql` script in Supabase SQL Editor to update your role.
- Ensure you have logged out and logged back in after role update.

## Support

For issues and questions:
1. Check the [API Documentation](./API-DOCUMENTATION.md)
2. Review the [System Specification](./.agent/workflows/sogolo-system-spec.md)
3. Contact the development team

## License

Proprietary - All rights reserved

## Contributors

- Development Team

---

**Version**: 1.0.0  
**Last Updated**: November 2025
