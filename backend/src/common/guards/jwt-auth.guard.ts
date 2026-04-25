import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── Step 0: Skip JWT for routes marked @Public() ──────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // ── Step 1: Extract the raw Authorization header ─────────────────────
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // ── Step 2: Split "Bearer <token>" and validate the format ───────────
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Authorization header must be in the format: Bearer <token>',
      );
    }

    const token = parts[1];

    if (!token || token.trim() === '') {
      throw new UnauthorizedException('JWT token is missing');
    }

    // ── Step 3: Cryptographically verify the token ───────────────────────
    let payload: {
      sub: string;
      email: string;
      role: string;
      contactNumber: string;
      iat: number;
    };

    try {
      const secret = this.configService.get<string>('app.jwt.secret');
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch (err: any) {
      throw new UnauthorizedException(
        err?.name === 'TokenExpiredError'
          ? 'Token has expired — please log in again'
          : 'Invalid token — verification failed',
      );
    }

    // ── Step 4: Validate required claims are present ─────────────────────
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException(
        'Token payload is incomplete — required claims missing',
      );
    }

    // ── Step 5: DB check — confirm user still exists and is active ────────
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'User associated with this token no longer exists',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // ── Step 6: Reject tokens issued before the last logout ───────────────
    // `payload.iat` is seconds-since-epoch; lastLogoutAt is a Date.
    // If the token was signed before the user last logged out, it means
    // they've since signed out and this token must no longer be trusted.
    if (
      user.lastLogoutAt &&
      payload.iat * 1000 < user.lastLogoutAt.getTime()
    ) {
      throw new UnauthorizedException(
        'Token has been revoked — please log in again',
      );
    }

    request.user = {
      sub:           payload.sub,
      email:         payload.email,
      role:          user.role,
      contactNumber: payload.contactNumber ?? '',
    };

    return true;
  }
}