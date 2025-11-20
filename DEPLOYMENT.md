# Deployment Guide for Sogolo Platform

## Overview
This guide covers deploying the Sogolo platform to various hosting providers.

## Prerequisites
- Supabase project set up (see SUPABASE_SETUP.md)
- Domain name (optional but recommended)
- SSL certificate (handled by most hosting providers)

## Deployment Options

### 1. Netlify (Recommended)
Netlify is perfect for static sites with form handling and serverless functions.

#### Steps:
1. **Connect Repository**
   ```bash
   # Push your code to GitHub/GitLab
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/sogolo-platform.git
   git push -u origin main
   ```

2. **Deploy on Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Build settings:
     - Build command: `echo "Static site"`
     - Publish directory: `.` (root)

3. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Custom Domain** (Optional)
   - Go to Domain settings
   - Add your custom domain
   - Configure DNS records as instructed

### 2. Vercel
Great for static sites with excellent performance.

#### Steps:
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure**
   - Follow the prompts
   - Add environment variables in Vercel dashboard

### 3. GitHub Pages
Free hosting for public repositories.

#### Steps:
1. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to Pages section
   - Select source branch (main)

2. **Custom Domain** (Optional)
   - Add CNAME file with your domain
   - Configure DNS

### 4. Traditional Web Hosting
For shared hosting or VPS.

#### Steps:
1. **Upload Files**
   - Use FTP/SFTP to upload all files
   - Ensure index.html is in the root directory

2. **Configure Web Server**
   - Ensure proper MIME types for .js files
   - Set up HTTPS redirect
   - Configure caching headers

## Post-Deployment Configuration

### 1. Update Supabase Settings
- Go to Supabase Dashboard > Authentication > Settings
- Add your production URL to "Site URL"
- Add your domain to "Additional Redirect URLs"

### 2. Configure OAuth Providers
Update OAuth redirect URLs:
- Google: Add `https://yourdomain.com/dashboard.html`
- Facebook: Add your production domain

### 3. Test Authentication Flow
- Test email/password signup and login
- Test Google OAuth
- Test password reset
- Verify email confirmations work

### 4. Set up Monitoring
- Configure error tracking (Sentry, LogRocket)
- Set up uptime monitoring
- Configure analytics (Google Analytics)

## Environment-Specific Configuration

### Production
```javascript
// js/config/production.js
const config = {
  environment: 'production',
  debug: false,
  apiUrl: 'https://yourdomain.com',
  supabaseUrl: 'https://your-project.supabase.co',
  // Add production-specific settings
};
```

### Staging
```javascript
// js/config/staging.js
const config = {
  environment: 'staging',
  debug: true,
  apiUrl: 'https://staging.yourdomain.com',
  supabaseUrl: 'https://your-staging-project.supabase.co',
  // Add staging-specific settings
};
```

## Security Checklist

### Before Going Live:
- [ ] Update Supabase RLS policies
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Enable HTTPS everywhere
- [ ] Configure CSP headers
- [ ] Remove debug logs
- [ ] Test all user flows
- [ ] Verify file upload security
- [ ] Check for exposed API keys

### Supabase Security:
- [ ] Enable RLS on all tables
- [ ] Configure proper user roles
- [ ] Set up database backups
- [ ] Monitor usage and quotas
- [ ] Configure email templates
- [ ] Set up webhook endpoints (if needed)

## Performance Optimization

### 1. Image Optimization
```bash
# Optimize images before deployment
npm install -g imagemin-cli
imagemin *.png --out-dir=optimized/
```

### 2. Code Minification
```html
<!-- Use minified versions in production -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

### 3. Caching Headers
```apache
# .htaccess for Apache
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
</IfModule>
```

## Backup Strategy

### 1. Code Backup
- Use Git for version control
- Regular commits and pushes
- Tag releases

### 2. Database Backup
- Supabase automatic backups (Pro plan)
- Manual exports for critical data
- Test restore procedures

### 3. File Backup
- Regular backups of uploaded files
- Use cloud storage with versioning

## Monitoring and Maintenance

### 1. Health Checks
```javascript
// Add to your monitoring service
const healthCheck = async () => {
  try {
    const response = await fetch('https://yourdomain.com/index.html');
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

### 2. Error Tracking
```javascript
// Add error tracking
window.addEventListener('error', (event) => {
  // Send to error tracking service
  console.error('Global error:', event.error);
});
```

### 3. Performance Monitoring
- Monitor page load times
- Track user interactions
- Monitor API response times
- Set up alerts for issues

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check Supabase CORS settings
   - Verify domain configuration

2. **Authentication Issues**
   - Check redirect URLs
   - Verify OAuth configuration
   - Test email delivery

3. **File Upload Issues**
   - Check Supabase storage policies
   - Verify file size limits
   - Test different file types

4. **Performance Issues**
   - Optimize images
   - Enable compression
   - Use CDN for assets

## Support

For deployment issues:
1. Check this documentation
2. Review Supabase documentation
3. Check hosting provider documentation
4. Contact support if needed

## Updates and Maintenance

### Regular Tasks:
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Monitor performance
- [ ] Backup data
- [ ] Test critical flows
- [ ] Review user feedback
- [ ] Update documentation
