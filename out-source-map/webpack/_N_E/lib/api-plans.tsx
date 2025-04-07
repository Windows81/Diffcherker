import ActionsApiBasic from 'components/content-pages/actions-api-basic';
import ActionsApiStandard from 'components/content-pages/actions-api-standard';
import ActionsApiBusiness from 'components/content-pages/actions-api-business';
import ActionsApiEnterprise from 'components/content-pages/actions-api-enterprise';
import { API_MONTHLY_99, API_MONTHLY_299 } from 'lib/plans';

const apiPlans = [
  {
    value: 'basic',
    name: 'Basic (Free)',
    promoted: false,
    label: 'Basic',
    action: <ActionsApiBasic />,
    subplans: [
      {
        value: 'basic',
        label: 'Basic',
        description: [],
      },
    ],
  },
  {
    value: 'standard',
    name: `Standard ($${API_MONTHLY_99.price})`,
    promoted: true,
    label: <span style={{ color: 'var(--colors-green-500)' }}>Standard</span>,
    action: <ActionsApiStandard />,
    subplans: [
      {
        value: 'standard',
        label: 'Standard',
        description: [],
      },
    ],
  },
  {
    value: 'business',
    name: `Business ($${API_MONTHLY_299.price})`,
    promoted: false,
    label: 'Business',
    action: <ActionsApiBusiness />,
    subplans: [
      {
        value: 'business',
        label: 'Business',
        description: [],
      },
    ],
  },
  {
    value: 'enterprise',
    name: 'Enterprise',
    promoted: false,
    label: 'Enterprise',
    action: <ActionsApiEnterprise />,
    subplans: [
      {
        value: 'enterprise',
        label: 'Enterprise',
        description: [],
      },
    ],
  },
];

export default apiPlans;
