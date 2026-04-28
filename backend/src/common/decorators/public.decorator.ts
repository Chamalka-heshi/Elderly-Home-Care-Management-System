import { SetMetadata } from '@nestjs/common';

// Public Access Decorator

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a specific endpoint or controller as accessible without authentication, bypassing the global JWT guard.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
