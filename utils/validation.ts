// utils/validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};
export const isValidPhone = (number: string): boolean => {
  const phoneRegex = /^(\+233|0)[235]\d{8}$/;
  return phoneRegex.test(number.trim());
};
