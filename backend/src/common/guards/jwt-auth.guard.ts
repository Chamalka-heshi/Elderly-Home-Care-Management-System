import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector }     from '@nestjs/core';

import { UsersService }  from '../../modules/users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';


// Secures application endpoints by validating incoming JSON Web Tokens, enforcing session integrity, and verifying account active status.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService:    JwtService,
    private readonly configService: ConfigService,
    private readonly usersService:  UsersService,
    private readonly reflector:     Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Permits access to routes explicitly marked as public via the @Public() decorator.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('Authorization header is missing');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Authorization header must be in the format: Bearer <token>');
    }

    const token = parts[1];
    if (!token || token.trim() === '') throw new UnauthorizedException('JWT token is missing');

    let payload: {
      sub:           string;
      email:         string;
      role:          string;
      iat:           number;
      exp:           number;
    };

    try {
      payload      = await this.jwtService.verifyAsync(token);
    } catch (err: any) {
      throw new UnauthorizedException(
        err?.name === 'TokenExpiredError'
          ? 'Token has expired — please log in again'
          : 'Invalid token — verification failed',
      );
    }

    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Token payload is incomplete — required claims missing');
    }

    // Verifies that the identity within the token corresponds to an existing and operational user account.
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // Prevents the reuse of legacy tokens issued prior to the most recent logout event to ensure session termination.
    if (
      user.lastLogoutAt &&
      payload.iat * 1000 < user.lastLogoutAt.getTime()
    ) {
      throw new UnauthorizedException('Token has been revoked — please log in again');
    }

    // Injects the validated identity payload into the request object for downstream consumption by controllers and decorators.
    request.user = {
      sub:           payload.sub,
      email:         payload.email,
      role:          user.role,
    };

    return true;
  }
}