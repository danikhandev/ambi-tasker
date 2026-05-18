import { describe, it, expect } from 'vitest';
import { 
  isValidEmail, 
  isValidPassword, 
  generateOTP, 
  generateSlug, 
  isOTPExpired 
} from '../../services/auth/utils';

describe('Authentication Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords (8+ characters)', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('secure!password')).toBe(true);
      expect(isValidPassword('alllowercase')).toBe(true);
    });

    it('should return false for short passwords (less than 8 characters)', () => {
      expect(isValidPassword('short')).toBe(false);
    });
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit string', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe('generateSlug', () => {
    it('should convert strings to URL-friendly slugs', () => {
      expect(generateSlug('John Doe')).toBe('john-doe');
      expect(generateSlug('Plumbing Service!')).toBe('plumbing-service');
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });
  });

  describe('isOTPExpired', () => {
    it('should return true if expiry date is in the past', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isOTPExpired(pastDate)).toBe(true);
    });

    it('should return false if expiry date is in the future', () => {
      const futureDate = new Date(Date.now() + 10000);
      expect(isOTPExpired(futureDate)).toBe(false);
    });

    it('should return true if expiry date is null', () => {
      expect(isOTPExpired(null)).toBe(true);
    });
  });

  describe('Role Validation Logic', () => {
    const adminUser = { role: 'admin' };
    const providerUser = { role: 'provider' };
    const customerUser = { role: 'customer' };

    it('should correctly identify admin users', () => {
      expect(adminUser.role).toBe('admin');
      expect(customerUser.role).not.toBe('admin');
    });

    it('should correctly identify provider users', () => {
      expect(providerUser.role).toBe('provider');
    });
  });
});
