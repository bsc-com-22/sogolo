// Validation utilities for Sogolo Platform
class Validation {
    // Email validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone number validation (Malawi format)
    static isValidPhone(phone) {
        // Remove spaces and special characters
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Malawi phone number patterns
        const malawiPatterns = [
            /^(\+265|265)?[18]\d{8}$/, // Mobile: +265 8xxxxxxxx or +265 1xxxxxxxx
            /^(\+265|265)?[18]\d{7}$/,  // Alternative mobile format
        ];
        
        return malawiPatterns.some(pattern => pattern.test(cleanPhone));
    }

    // Password validation
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    // Calculate password strength
    static calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        if (password.length >= 16) score += 1;
        
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }

    // Name validation
    static isValidName(name) {
        if (!name || name.trim().length < 2) {
            return { isValid: false, error: 'Name must be at least 2 characters long' };
        }
        
        if (name.trim().length > 50) {
            return { isValid: false, error: 'Name must be less than 50 characters' };
        }
        
        // Allow letters, spaces, hyphens, and apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(name.trim())) {
            return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        return { isValid: true };
    }

    // Amount validation
    static isValidAmount(amount, min = 0, max = 10000000) {
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { isValid: false, error: 'Amount must be a valid number' };
        }
        
        if (numAmount < min) {
            return { isValid: false, error: `Amount must be at least MWK ${min.toLocaleString()}` };
        }
        
        if (numAmount > max) {
            return { isValid: false, error: `Amount cannot exceed MWK ${max.toLocaleString()}` };
        }
        
        return { isValid: true, amount: numAmount };
    }

    // Product name validation
    static isValidProductName(productName) {
        if (!productName || productName.trim().length < 3) {
            return { isValid: false, error: 'Product name must be at least 3 characters long' };
        }
        
        if (productName.trim().length > 100) {
            return { isValid: false, error: 'Product name must be less than 100 characters' };
        }
        
        return { isValid: true };
    }

    // Description validation
    static isValidDescription(description, minLength = 10, maxLength = 1000) {
        if (!description || description.trim().length < minLength) {
            return { isValid: false, error: `Description must be at least ${minLength} characters long` };
        }
        
        if (description.trim().length > maxLength) {
            return { isValid: false, error: `Description must be less than ${maxLength} characters` };
        }
        
        return { isValid: true };
    }

    // File validation
    static isValidFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) { // 5MB default
        if (!file) {
            return { isValid: false, error: 'No file selected' };
        }
        
        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
        }
        
        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
        }
        
        return { isValid: true };
    }

    // Image file validation
    static isValidImage(file, maxSize = 2 * 1024 * 1024) { // 2MB default
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return this.isValidFile(file, allowedTypes, maxSize);
    }

    // Document file validation
    static isValidDocument(file, maxSize = 5 * 1024 * 1024) { // 5MB default
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return this.isValidFile(file, allowedTypes, maxSize);
    }

    // URL validation
    static isValidUrl(url) {
        try {
            new URL(url);
            return { isValid: true };
        } catch {
            return { isValid: false, error: 'Invalid URL format' };
        }
    }

    // Date validation
    static isValidDate(dateString) {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return { isValid: false, error: 'Invalid date format' };
        }
        
        return { isValid: true, date };
    }

    // Age validation (from date of birth)
    static isValidAge(dateOfBirth, minAge = 18, maxAge = 120) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        
        if (isNaN(birthDate.getTime())) {
            return { isValid: false, error: 'Invalid date of birth' };
        }
        
        if (birthDate > today) {
            return { isValid: false, error: 'Date of birth cannot be in the future' };
        }
        
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (age < minAge) {
            return { isValid: false, error: `You must be at least ${minAge} years old` };
        }
        
        if (age > maxAge) {
            return { isValid: false, error: `Age cannot exceed ${maxAge} years` };
        }
        
        return { isValid: true, age };
    }

    // Sanitize input (prevent XSS)
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Validate form data
    static validateForm(formData, rules) {
        const errors = {};
        let isValid = true;
        
        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = formData[field];
            
            for (const rule of fieldRules) {
                const result = rule.validator(value);
                
                if (!result.isValid) {
                    errors[field] = result.error || rule.message;
                    isValid = false;
                    break; // Stop at first error for this field
                }
            }
        }
        
        return { isValid, errors };
    }

    // Common validation rules
    static RULES = {
        required: (value) => ({
            isValid: value !== null && value !== undefined && value.toString().trim() !== '',
            error: 'This field is required'
        }),
        
        email: (value) => this.isValidEmail(value) ? 
            { isValid: true } : 
            { isValid: false, error: 'Please enter a valid email address' },
            
        phone: (value) => this.isValidPhone(value) ? 
            { isValid: true } : 
            { isValid: false, error: 'Please enter a valid phone number' },
            
        minLength: (min) => (value) => ({
            isValid: !value || value.length >= min,
            error: `Must be at least ${min} characters long`
        }),
        
        maxLength: (max) => (value) => ({
            isValid: !value || value.length <= max,
            error: `Must be no more than ${max} characters long`
        })
    };
}

// Make available globally
window.Validation = Validation;
