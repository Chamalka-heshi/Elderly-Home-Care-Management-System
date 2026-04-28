import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../enums/user-role.enum';

// Role Authorization Decorator

export const ROLES_KEY = 'roles';

// Restricts access to clinical or administrative endpoints based on a list of approved system roles.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
