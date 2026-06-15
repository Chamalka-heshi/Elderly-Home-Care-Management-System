import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CsrfGuard } from './csrf.guard';
import { RolesGuard } from './roles.guard';

@Injectable()
export class GlobalSecurityGuard implements CanActivate {
  constructor(
    private readonly throttler: AuthThrottlerGuard,
    private readonly jwtGuard: JwtAuthGuard,
    private readonly csrfGuard: CsrfGuard,
    private readonly rolesGuard: RolesGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Rate limiting (IP or user)
    await this.throttler.canActivate(context);

    // 2. Authentication (JwtAuthGuard honors @Public())
    await this.jwtGuard.canActivate(context);

    // 3. CSRF validation (runs after auth to use auth cookie when present)
    await this.csrfGuard.canActivate(context);

    // 4. Roles / authorization
    return this.rolesGuard.canActivate(context);
  }
}
