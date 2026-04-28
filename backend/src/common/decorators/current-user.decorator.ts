import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Identity Extraction Decorator

// Extracts the authenticated identity payload or specific claims from the request context after JWT validation.
export const GetUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user    = request.user;
    
    // Returns the specific requested property or the entire identity object to facilitate role-based logic in controllers.
    return field ? user?.[field] : user;
  },
);

/** @deprecated Use GetUser instead */
export const CurrentUser = GetUser;
