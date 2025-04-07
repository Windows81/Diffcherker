export default function isPlatformMac() {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) {
    return;
  }

  const platformString =
    window.navigator?.userAgentData?.platform ||
    window.navigator?.platform ||
    window.navigator?.userAgent ||
    '';
  return (
    platformString.includes('mac') ?? platformString.includes('Mac') ?? false
  );
}
