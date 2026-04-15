import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;       // expiry  – Unix timestamp in SECONDS
  sub?: string;
  [key: string]: unknown;
}

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    // exp is in seconds → convert to ms for comparison with Date.now()
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};