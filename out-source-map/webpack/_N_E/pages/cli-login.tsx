import withSession from 'components/with-session';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import { getCliToken } from 'models/user-model';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const CliLogin: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const port = arrayFirstOrSelf(router.query.port);
    if (!port) {
      router.replace('/');
      return;
    }
    getCliToken().then((res) => {
      const token = res.data?.token;
      window.location.replace(
        `http://localhost:${port}/?token=${encodeURIComponent(token)}`,
      );
    });
  }, [router]);

  return null;
};

export default withSession(CliLogin);
