export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[a-zA-Z\s-]+$/.test(name);
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string[] };
}

export const validateRegistrationData = (data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: { [key: string]: string[] } = {};
  
  // Validate name
  if (!validateName(data.name)) {
    errors.name = ['Name must be at least 2 characters long and contain only letters, spaces, and hyphens'];
  }
  
  // Validate email
  if (!validateEmail(data.email)) {
    errors.email = ['Please enter a valid email address'];
  }
  
  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
  }
  
  // Validate password match
  if (!validatePasswordMatch(data.password, data.confirmPassword)) {
    errors.confirmPassword = ['Passwords do not match'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginData = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: { [key: string]: string[] } = {};
  
  // Validate email
  if (!validateEmail(data.email)) {
    errors.email = ['Please enter a valid email address'];
  }
  
  // Validate password presence
  if (!data.password) {
    errors.password = ['Password is required'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 