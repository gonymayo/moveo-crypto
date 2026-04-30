import jwt, { SignOptions } from 'jsonwebtoken';

// Shape of the data we embed inside every JWT.
export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Signs a new JWT for the given user.
 * The secret and expiry are read from environment variables so they can be
 * rotated without code changes.
 */
export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in environment variables');

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws a JsonWebTokenError if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in environment variables');

  return jwt.verify(token, secret) as JwtPayload;
}
