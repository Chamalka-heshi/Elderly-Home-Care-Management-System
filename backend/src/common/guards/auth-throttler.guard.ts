import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Prefer authenticated user-based throttling
    if (req.user && req.user.sub) {
      return `user:${req.user.sub}`;
    }

    // Support proxy headers; take first IP if multiple
    const forwarded = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
    if (forwarded) {
      const ip = String(forwarded).split(',')[0].trim();
      return `ip:${ip}`;
    }

    return `ip:${req.ip || 'unknown'}`;
  }
}
