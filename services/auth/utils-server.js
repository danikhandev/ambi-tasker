/* eslint-disable @typescript-eslint/no-require-imports */
const { jwtVerify } = require("jose");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Get secret key as Uint8Array for jose
 */
function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Verify JWT token (async for jose)
 */
async function verifyToken(token) {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("Token expired at:", new Date(payload.exp * 1000));
      return null;
    }

    return payload;
  } catch (error) {
    // Log specific error types for debugging
    if (error?.code === "ERR_JWT_EXPIRED") {
      console.log("JWT expired:", error.message);
    } else {
      console.log("JWT verification error:", error);
    }
    return null;
  }
}

module.exports = { verifyToken };
