import jwt from 'jsonwebtoken';

export function generateAccessToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId, email }, secret, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not set');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}
