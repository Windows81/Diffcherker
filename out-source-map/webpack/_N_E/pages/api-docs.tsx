import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function APIDocsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/docs/getting-started');
  }, [router]);

  return null;
}
