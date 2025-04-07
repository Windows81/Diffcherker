import CryptoJS, { HmacSHA256 } from 'crypto-js';

const DEFAULT_OFFLINE_LICENSE_SECRET = 'fbxoeTRiAvtDQmTz8XxpErfS3iEq4jZl';

function base64UrlEncode(str: string) {
  const b64Encoded = Buffer.from(str).toString('base64');
  return b64Encoded.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

export function verifySignature(
  key: string,
  secret: string = DEFAULT_OFFLINE_LICENSE_SECRET,
) {
  const keyParts = key.trim().split('.');
  if (keyParts.length !== 3) {
    return false;
  }

  const header = keyParts[0];
  const payload = keyParts[1];
  const signature1 = keyParts[2];
  const signature2 = jwtSignature(`${header}.${payload}`, secret);

  return signature1 === signature2;
}

export function jwtSignature(
  headerAndPayload: string,
  secret: string = DEFAULT_OFFLINE_LICENSE_SECRET,
) {
  const signature = HmacSHA256(headerAndPayload, secret);
  return signature.toString(CryptoJS.enc.Base64url);
}

export function jwtEncode(
  payload: Record<string, string | number | symbol | boolean>,
  header: Record<string, string | number | symbol | boolean> = {
    alg: 'HS256',
    typ: 'JWT',
  },
  secret: string = DEFAULT_OFFLINE_LICENSE_SECRET,
) {
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const headerAndPayload = `${headerEncoded}.${payloadEncoded}`;

  const signature = jwtSignature(headerAndPayload, secret);
  return `${headerAndPayload}.${signature}`;
}
