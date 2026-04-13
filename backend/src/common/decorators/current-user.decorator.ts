/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user (or a specific field) from the JWT request.
 * 
 *   @GetUser()          → full user object  { sub, email, role, contactNumber }
 *   @GetUser('sub')     → just the user id string  (JWT stores userId as 'sub')
 *   @GetUser('role')    → just the role string
 *   @GetUser('email')   → just the email string
 *
 * NOTE: use @GetUser('sub') for the user ID — the guard sets req.user.sub,
 * not req.user.id. Using @GetUser('id') will return undefined.
 */
export const GetUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);

/** @deprecated Use GetUser instead */
export const CurrentUser = GetUser;
