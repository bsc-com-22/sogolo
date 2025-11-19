# Sogolo - Secure Social Trading Platform

A modern, responsive website for Sogolo, a secure escrow service that bridges trust between buyers and sellers in Malawi's social media marketplace.

## 🚀 Features

### Core Pages
- **Home Page** (`index.html`) - Landing page with hero section, features, testimonials, and FAQ
- **Sign In Page** (`signin.html`) - Authentication page with login and signup forms
- **Support Page** (`support.html`) - Customer support with contact methods and help resources

### Key Components
- **Responsive Design** - Mobile-first approach with hamburger navigation
- **Interactive Elements** - FAQ accordion, form validation, mobile menu
- **Modern UI** - Clean design with smooth animations and hover effects
- **Cross-Browser Compatible** - Works on all modern browsers

## 📱 Mobile Features

### Hamburger Menu System
- Fixed hamburger button (top-right corner)
- Slide-out navigation menu (280-300px width)
- Left-aligned content as requested
- Smooth CSS animations and JavaScript functionality

### Responsive Breakpoints
- **768px** - Primary mobile/tablet breakpoint
- **480px** - Small mobile devices optimization

### Mobile Optimizations
- Left-aligned hero sections and footer content
- Touch-friendly button sizes
- Optimized form layouts (stacked inputs)
- Reduced padding and margins for mobile screens

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#3b82f6`
- **Dark Blue**: `#1e40af` 
- **Gray Scale**: `#1f2937`, `#6b7280`, `#9ca3af`
- **Background**: Light gradient (`#f8fafc` to `#e2e8f0`)

### Typography
- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Responsive Font Sizes**: Scales from desktop to mobile
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 📁 Project Structure

```
sogolo-website/
├── index.html          # Home page
├── signin.html         # Authentication page
├── support.html        # Support page
├── css/
│   └── styles.css      # External CSS (if used)
├── js/
│   └── app.js          # External JavaScript (if used)
├── logo.png            # Company logo
└── README.md           # This file
```

## 🔧 Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation
1. **Clone or Download** the project files
2. **Open** `index.html` in your web browser
3. **Navigate** between pages using the navigation menu

### Development Server (Optional)
For local development with live reload:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 📋 Page Details

### Home Page (`index.html`)
- **Hero Section** - Main value proposition with call-to-action
- **About Section** - Company mission and key features
- **How It Works** - 4-step process explanation
- **Why Choose Us** - 6 feature cards with SVG icons
- **FAQ Section** - Expandable accordion with common questions
- **Testimonials** - User reviews with avatars and verification badges
- **CTA Section** - Final call-to-action with gradient background
- **Footer** - Links, company info, and Nyasa Creatives credit

### Sign In Page (`signin.html`)
- **Toggle Forms** - Switch between Login and Sign Up
- **Form Validation** - Password matching and required fields
- **Social Login** - Google sign-in integration ready
- **Mobile Menu** - Account access options in mobile navigation
- **Light Background** - Soft gradient for better UX

### Support Page (`support.html`)
- **Contact Methods** - Email, Phone, and Blantyre office location
- **Contact Form** - Comprehensive support ticket form
- **FAQ Section** - Support-specific questions and answers
- **Same Header/Footer** - Consistent with home page design

## 🛠 Technical Features

### JavaScript Functionality
- **Mobile Menu Toggle** - Smooth slide-in/out animations
- **FAQ Accordion** - Expandable question/answer sections
- **Form Validation** - Client-side validation for better UX
- **Auto Copyright Year** - Automatically updates to current year
- **Header Scroll Effect** - Shadow appears on scroll

### CSS Features
- **CSS Grid & Flexbox** - Modern layout techniques
- **CSS Animations** - Smooth transitions and hover effects
- **Media Queries** - Responsive design for all devices
- **CSS Variables** - Consistent color and spacing system

### Accessibility
- **Semantic HTML** - Proper heading hierarchy and landmarks
- **Alt Text** - Descriptive alt text for images
- **Keyboard Navigation** - All interactive elements are keyboard accessible
- **Color Contrast** - WCAG compliant color combinations

## 🎯 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile Browsers** - iOS Safari, Chrome Mobile

## 📞 Contact Information

### Business Details
- **Company**: Sogolo
- **Location**: Blantyre, Malawi
- **Email**: support@sogolo.com
- **Phone**: +265 1 234 567

### Development
- **Developed by**: Nyasa Creatives
- **Website**: https://nyasacreatives.com

## 📄 License

© Sogolo.com 2025 All rights reserved.

## 🔄 Version History

### v1.0.0 (Current)
- Initial website launch
- Responsive design implementation
- Mobile hamburger menu
- FAQ and testimonials sections
- Contact forms and support pages
- Auto-updating copyright year

## 🚀 Future Enhancements

### Planned Features
- **User Dashboard** - Account management interface
- **Transaction Tracking** - Real-time transaction status
- **Payment Integration** - Mobile money and card processing
- **Multi-language Support** - English and Chichewa
- **Progressive Web App** - Offline functionality
- **Analytics Integration** - User behavior tracking

### Technical Improvements
- **Performance Optimization** - Image compression and lazy loading
- **SEO Enhancement** - Meta tags and structured data
- **Security Headers** - Content Security Policy implementation
- **API Integration** - Backend service connections

## 📚 Documentation

### Code Comments
All major functions and sections are documented with inline comments for easy maintenance and updates.

### Naming Conventions
- **CSS Classes**: kebab-case (e.g., `mobile-menu-btn`)
- **JavaScript Functions**: camelCase (e.g., `toggleMobileMenu`)
- **File Names**: lowercase with hyphens (e.g., `signin.html`)

### Best Practices
- Mobile-first responsive design
- Progressive enhancement approach
- Semantic HTML structure
- Accessible form design
- Performance-optimized assets

---

**Built with ♥ by Nyasa Creatives**
