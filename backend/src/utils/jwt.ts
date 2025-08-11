import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev_secret_change_me';
const JWT_EXPIRES: string | number = process.env.JWT_EXPIRES ?? '7d';

export type JwtPayload = {
  userId: string;
  role: 'user' | 'facility_owner' | 'admin';
};

export function signToken(payload: JwtPayload) {
  const expires: number | string = isNaN(Number(JWT_EXPIRES)) ? JWT_EXPIRES : Number(JWT_EXPIRES);
  const opts: SignOptions = { expiresIn: expires as any, algorithm: 'HS256' };
  return jwt.sign(payload as object, JWT_SECRET as Secret, opts);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET as Secret) as JwtPayload;
}
