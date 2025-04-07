import Link from 'next/link';
import Button from './button';
import Tracking from 'lib/tracking';

interface ExpiredTrialProps {
  isTrial: boolean;
}

const ExpiredTrial: React.FC = () => {
  return (
    <div>
      <div style={{ fontSize: 26, marginBottom: 32, marginTop: 16 }}>
        Your trial has expired :(
      </div>
      <Link href={`/buy-desktop?term=yearly`}>
        <Button
          type="brand"
          size="big"
          onClick={() => {
            Tracking.trackEvent('Clicked get diffchecker', {
              type: 'buy',
              position: 'desktop-browser-login',
            });
          }}
        >
          Buy Diffchecker Desktop
        </Button>
      </Link>
    </div>
  );
};

const ExpiredSubscription: React.FC = () => {
  return (
    <div>
      <div style={{ fontSize: 26, marginBottom: 32, marginTop: 16 }}>
        Your subscription has expired :(
      </div>
      <Link href={`/buy-desktop?term=yearly`}>
        <Button type="brand" size="big">
          Renew license
        </Button>
      </Link>
    </div>
  );
};

const ExpiredLicense: React.FC<ExpiredTrialProps> = (props) => {
  return <>{props.isTrial ? <ExpiredTrial /> : <ExpiredSubscription />}</>;
};

export default ExpiredLicense;
