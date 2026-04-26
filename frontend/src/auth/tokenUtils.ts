import { jwtDecode } from "jwt-decode";

// Expected structure of the decoded JWT payload
interface JwtPayload {
  exp: number; // Expiry - Unix timestamp in SECONDS
  sub?: string;
  [key: string]: unknown;
}

// Checks if a given JWT token is still valid or has expired
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const { exp } = jwtDecode<JwtPayload>(token);

    // Convert exp (seconds) to milliseconds for comparison with Date.now()
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};
