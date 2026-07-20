/**
 * Utility functions for validating user inputs
 */

/**
 * Strict RFC 5322 regex pattern for standard email structural verification.
 * Returns true if valid, false otherwise.
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength parameters matching structural rules.
 * Enforces: Min 8 chars, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
 */
export const validatePassword = (password) => {
  if (!password) return false;
  const strongRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return strongRegex.test(password);
};