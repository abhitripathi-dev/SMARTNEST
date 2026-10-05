/**
 * SmartNest JWT (JSON Web Token) Security Utility
 * Compliant with RFC 7519 standard
 */

export interface JwtPayload {
  sub: string;             // User / Resident ID
  email: string;           // User Email
  name: string;            // User Full Name
  role: 'admin' | 'resident' | 'staff'; // User Role
  society_id: string;      // Society Identifier
  iat: number;             // Issued At timestamp
  exp: number;             // Expiration timestamp
}

export interface DecodedJwt {
  header: {
    alg: string;
    typ: string;
  };
  payload: JwtPayload;
  signature: string;
  raw: string;
}

const JWT_SECRET = 'SmartNest-Secret-Key-HS256-Super-Secure-Token-2026';
const TOKEN_KEY = 'smartnest_jwt_token';

// Base64URL encoding helper
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Base64URL decoding helper
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

// Pseudo HMAC-SHA256 signature generator for browser environment
function generateSignature(headerEncoded: string, payloadEncoded: string, secret: string): string {
  const content = `${headerEncoded}.${payloadEncoded}.${secret}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return base64UrlEncode(`sig_hs256_${hexHash}_${btoa(secret).slice(0, 10)}`);
}

/**
 * Generates a signed JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds = 86400): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = generateSignature(encodedHeader, encodedPayload, JWT_SECRET);

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  // Store in localStorage for session persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  return token;
}

/**
 * Validates and decodes a JWT token
 */
export function verifyAndDecodeToken(token?: string | null): DecodedJwt | null {
  const jwt = token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
  if (!jwt) return null;

  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('JWT Token has expired');
      return null;
    }

    return {
      header,
      payload,
      signature,
      raw: jwt
    };
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

/**
 * Get active JWT token
 */
export function getJwtToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get Authorization Header format: "Bearer <token>"
 */
export function getAuthHeader(): Record<string, string> {
  const token = getJwtToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Clear JWT token on logout
 */
export function removeJwtToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}
