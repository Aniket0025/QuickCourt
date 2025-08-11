import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev_secret_change_me';
const JWT_EXPIRES: string | number = process.env.JWT_EXPIRES ?? '7d';

export type JwtPayload = {
  userId: string;
  role: 'user' | 'facility_owner' | 'admin';
};

export function signToken(payload: JwtPayload) {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES as any };
  return jwt.sign(payload as object, JWT_SECRET, opts);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
