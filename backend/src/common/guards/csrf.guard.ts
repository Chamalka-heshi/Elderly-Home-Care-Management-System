import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  // Generate a random CSRF token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Skip CSRF check for public auth endpoints (login, signup, password reset)
    const publicEndpoints = [
      '/auth/login',
      '/auth/family/signup',
      '/auth/firebase',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/forgot-password/check-email',
    ];

    const path = request.path;
    if (publicEndpoints.some((ep) => path.includes(ep))) {
      return true;
    }

    // Verify CSRF token from header
    const csrfToken = request.headers['x-csrf-token'];
    const sessionToken = request.csrfToken;

    if (!csrfToken || !sessionToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Use timing-safe comparison to prevent timing attacks
    if (
      !crypto.timingSafeEqual(Buffer.from(csrfToken), Buffer.from(sessionToken))
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
