import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const secret =
  process.env.AUTH_SECRET;

if (!secret) {
  throw new Error(
    "AUTH_SECRET is not configured."
  );
}

const secretKey =
  new TextEncoder().encode(secret);

export function hashPassword(
  password: string
) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

export async function createSessionToken(
  user: {
    id: string | number;
    nickname: string;
  }
) {
  return new SignJWT({
    userId: String(user.id),
    nickname: user.nickname,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string
) {
  const { payload } =
    await jwtVerify(
      token,
      secretKey
    );

  return payload;
}