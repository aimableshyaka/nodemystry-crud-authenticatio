import jwt from "jsonwebtoken";

// Get JWT secret from environment or use default (change in production!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate JWT token
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate reset password token (expires in 1 hour)
 * @param email - User email
 * @returns Reset token string
 */
export const generateResetToken = (email: string): string => {
  return jwt.sign({ email }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

/**
 * Verify reset password token
 * @param token - Reset token to verify
 * @returns Email from token or null if invalid
 */
export const verifyResetToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded.email;
  } catch (error) {
    return null;
  }
};
