/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user (or a specific field) from the JWT request.
 * 
 *   @GetUser()          → full user object  { id, email, role }
 *   @GetUser('id')      → just the user id string
 *   @GetUser('role')    → just the role string
 *
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
