// utils/validation.ts - Improved phone validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPhone = (number: string): boolean => {
  // More inclusive Ghana phone number validation
  const phoneRegex = /^(\+233|0)[235789]\d{8}$/;
  return phoneRegex.test(number.trim().replace(/\s/g, ''));
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};