// Registration validation
export const validateRegistration = (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Password validation
  if (!password || password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }
  
  // Name validation
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  
  // Role validation (if provided)
  if (req.body.role) {
    const validRoles = ['PATIENT', 'DOCTOR', 'ADMIN'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
  }
  
  next();
};

// Login validation
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
}; 