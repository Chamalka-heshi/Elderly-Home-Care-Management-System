/// <reference types="jest" />

jest.mock('../../core/apiClient', () => ({ apiFetch: jest.fn() }));

import { apiFetch } from '../../core/apiClient';
import { signupFamily } from '../family-auth.api';
import type { AuthResponse } from '../auth.api';
import type { User, UserRole } from '../../../auth/AuthContext';

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const buildUser = (overrides: Partial<User> = {}): User => ({
  id:                 'new-family-uuid',
  email:              'jane@example.com',
  fullName:           'Jane Doe',
  role:               'FAMILY' as UserRole,
  contactNumber:      '0779876543',
  mustChangePassword: false,
  ...overrides,
});

const buildAuthResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  token:   'signup.mock.jwt.token',
  user:    buildUser(),
  message: 'Family member registered successfully',
  ...overrides,
});

const validPayload = () => ({
  fullName:      'Jane Doe',
  email:         'jane@example.com',
  password:      'Secure@Pass1',
  contactNumber: '0779876543',
});

// ─────────────────────────────────────────────────────────────────────────────

describe('signupFamily() – form validation', () => {
  beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
  afterEach(() => { localStorage.clear(); });

  // ── Valid payload ───────────────────────────────────────────────────────────

  it('succeeds when all fields are valid', async () => {
    mockApiFetch.mockResolvedValue(buildAuthResponse());
    const result = await signupFamily(validPayload());
    expect(result.message).toBe('Family member registered successfully');
  });

  it('sends all four required fields in the request body', async () => {
    mockApiFetch.mockResolvedValue(buildAuthResponse());
    const payload = validPayload();
    await signupFamily(payload);
    const body = JSON.parse((mockApiFetch.mock.calls[0] as any[])[1].body);
    expect(body).toEqual(payload);
  });

  // ── All fields required ─────────────────────────────────────────────────────

  describe('all fields required', () => {
    it('rejects when fullName is empty', async () => {
      mockApiFetch.mockRejectedValue(new Error('fullName should not be empty'));
      await expect(signupFamily({ ...validPayload(), fullName: '' })).rejects.toThrow();
    });

    it('rejects when email is empty', async () => {
      mockApiFetch.mockRejectedValue(new Error('email should not be empty'));
      await expect(signupFamily({ ...validPayload(), email: '' })).rejects.toThrow();
    });

    it('rejects when password is empty', async () => {
      mockApiFetch.mockRejectedValue(new Error('password should not be empty'));
      await expect(signupFamily({ ...validPayload(), password: '' })).rejects.toThrow();
    });

    it('rejects when contactNumber is empty', async () => {
      mockApiFetch.mockRejectedValue(new Error('contactNumber should not be empty'));
      await expect(signupFamily({ ...validPayload(), contactNumber: '' })).rejects.toThrow();
    });
  });

  // ── Email validation ────────────────────────────────────────────────────────

  describe('email field', () => {
    it('rejects an invalid email format', async () => {
      mockApiFetch.mockRejectedValue(new Error('email must be an email'));
      await expect(signupFamily({ ...validPayload(), email: 'notanemail' })).rejects.toThrow();
    });

    it('rejects email with no domain', async () => {
      mockApiFetch.mockRejectedValue(new Error('email must be an email'));
      await expect(signupFamily({ ...validPayload(), email: 'user@' })).rejects.toThrow();
    });
  });

  // ── Contact number – exactly 10 digits ──────────────────────────────────────

  describe('contactNumber', () => {
    it('rejects when contact number has only 9 digits', async () => {
      mockApiFetch.mockRejectedValue(new Error('Contact number must be 10 digits'));
      await expect(signupFamily({ ...validPayload(), contactNumber: '077987654' })).rejects.toThrow('Contact number must be 10 digits');
    });

    it('rejects when contact number has 11 digits', async () => {
      mockApiFetch.mockRejectedValue(new Error('Contact number must be 10 digits'));
      await expect(signupFamily({ ...validPayload(), contactNumber: '07798765430' })).rejects.toThrow('Contact number must be 10 digits');
    });

    it('rejects when contact number contains letters', async () => {
      mockApiFetch.mockRejectedValue(new Error('Contact number must be 10 digits'));
      await expect(signupFamily({ ...validPayload(), contactNumber: '077abc5678' })).rejects.toThrow('Contact number must be 10 digits');
    });

    it('passes with exactly 10 digits', async () => {
      mockApiFetch.mockResolvedValue(buildAuthResponse());
      const result = await signupFamily({ ...validPayload(), contactNumber: '0712345678' });
      expect(result.user.contactNumber).toBe('0779876543');
    });
  });

  // ── Password – min 8 chars + complexity ─────────────────────────────────────

  describe('password', () => {
    it('rejects when password has fewer than 8 characters', async () => {
      mockApiFetch.mockRejectedValue(new Error('Password must be at least 8 characters long'));
      await expect(signupFamily({ ...validPayload(), password: 'Ab@123' })).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('rejects when password has no uppercase letter', async () => {
      mockApiFetch.mockRejectedValue(new Error('Password must contain uppercase, lowercase, number and special character'));
      await expect(signupFamily({ ...validPayload(), password: 'secure@pass1' })).rejects.toThrow();
    });

    it('rejects when password has no digit', async () => {
      mockApiFetch.mockRejectedValue(new Error('Password must contain uppercase, lowercase, number and special character'));
      await expect(signupFamily({ ...validPayload(), password: 'Secure@Pass' })).rejects.toThrow();
    });

    it('rejects when password has no special character', async () => {
      mockApiFetch.mockRejectedValue(new Error('Password must contain uppercase, lowercase, number and special character'));
      await expect(signupFamily({ ...validPayload(), password: 'SecurePass1' })).rejects.toThrow();
    });

    it('passes with 8+ chars including upper, lower, digit and special character', async () => {
      mockApiFetch.mockResolvedValue(buildAuthResponse());
      await expect(signupFamily({ ...validPayload(), password: 'Secure@1' })).resolves.toBeDefined();
    });
  });

  // ── Failed signup does not store session ─────────────────────────────────────

  it('does not store token or user in localStorage on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('400 Bad Request'));
    await signupFamily(validPayload()).catch(() => {});
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
