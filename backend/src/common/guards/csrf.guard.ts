import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // Generates a cryptographically random CSRF token.
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Safe HTTP methods do not mutate state, so no CSRF protection is needed.
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // @Public() routes are unauthenticated session-establishing endpoints (login, signup, etc.).
    // CSRF only protects authenticated sessions, so these are always exempt.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Path-based fallback for public endpoints not covered by the @Public() decorator.
    const publicEndpoints = [
      '/auth/login',
      '/auth/family/signup',
      '/auth/firebase',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/forgot-password/check-email',
      '/contact',
      '/contactus',
      '/cost',
      '/payment',
      '/payments',
      '/payments/payhere/notify',
    ];

    const path = request.path || request.url || '';
    if (publicEndpoints.some((ep) => path.includes(ep))) {
      return true;
    }

    // Read the CSRF token from the request header and from the session cookie.
    const rawCsrfHeader =
      request.headers['x-csrf-token'] || request.headers['x-xsrf-token'];
    let csrfToken = Array.isArray(rawCsrfHeader) ? rawCsrfHeader[0] : rawCsrfHeader;
    const sessionToken = request.csrfToken || (request.cookies && request.cookies['csrf_token']);

    // Accept the token from the request body as a legacy fallback.
    if (!csrfToken && request.body && request.body.csrfToken) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      csrfToken = String(request.body.csrfToken);
      request.headers['x-csrf-token'] = csrfToken;
    }

    if (!csrfToken || !sessionToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Compare header token against session token using a timing-safe method.
    try {
      const a = Buffer.from(String(csrfToken));
      const b = Buffer.from(String(sessionToken));
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    } catch (e) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
