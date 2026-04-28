/// <reference types="jest" />

jest.mock('../../../config/firebase', () => ({}), { virtual: true });

jest.mock('../../core/apiClient', () => ({
  apiFetch: jest.fn(),
  API_BASE_URL: 'http://localhost:3000/api',
}));

import { apiFetch } from '../../core/apiClient';
import { signin } from '../auth.api';

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('signin() - backend error flow test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('returns real backend validation errors correctly', async () => {

    const credentials = {
      email: 'poorna@gmail.com',
      password: '',
    };

    // 🔥 simulate REAL NestJS backend response
    mockApiFetch.mockRejectedValue({
      statusCode: 400,
      message: [
        'email should not be empty',
        'email must be an email',
      ],
      error: 'Bad Request',
    });

    try {
      await signin(credentials);
    } catch (error: any) {

      // 🔥 IMPORTANT: your apiClient should join messages
      const errorMessage =
        Array.isArray(error.message)
          ? error.message.join(', ')
          : error.message;

      expect(errorMessage).toContain('email should not be empty');
      expect(errorMessage).toContain('email must be an email');

      console.log('Backend Error:', errorMessage);
    }
  });

  it('returns invalid credentials error', async () => {

    const credentials = {
      email: 'john@example.com',
      password: 'wrong',
    };

    mockApiFetch.mockRejectedValue({
      statusCode: 401,
      message: ['Invalid credentials'],
      error: 'Unauthorized',
    });

    try {
      await signin(credentials);
    } catch (error: any) {
      const errorMessage =
        Array.isArray(error.message)
          ? error.message.join(', ')
          : error.message;

      expect(errorMessage).toBe('Invalid credentials');
    }
  });

  it('success login stores token', async () => {

    const credentials = {
      email: 'john@example.com',
      password: 'Password@1',
    };

    mockApiFetch.mockResolvedValue({
      token: 'abc.token',
      user: { id: '1', email: credentials.email },
      message: 'Login successful',
    } as any);

    const res = await signin(credentials);

    expect(res.message).toBe('Login successful');
    expect(localStorage.getItem('token')).toBe('abc.token');
  });

});