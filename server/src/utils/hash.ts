import bcrypt from 'bcryptjs';

// Cost factor: 12 rounds is secure and fast enough on modern hardware.
const SALT_ROUNDS = 12;

/** Hashes a plain-text password. Returns the bcrypt hash string. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Returns true if the plain-text password matches the stored hash. */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
