export const calculateHash = async (buffer: ArrayBuffer): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const result = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return result;
};
