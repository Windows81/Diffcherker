import ActionsBasic from 'components/content-pages/actions-basic';
import ActionsPro from 'components/content-pages/actions-pro';
import ActionsEnterprise from 'components/content-pages/actions-enterprise';

export default function getPricingPlans(billing: 'monthly' | 'yearly') {
  return [
    {
      value: 'basic',
      name: 'Basic',
      promoted: false,
      label: 'Basic',
      action: <ActionsBasic />,
      subplans: [
        {
          value: 'basic',
          label: 'Basic',
          description: ['Best diffing tools available for free forever'],
        },
      ],
    },
    {
      value: 'pro-desktop',
      name: 'Pro + Desktop',
      promoted: true,
      label: (
        <>
          Pro +{' '}
          <span style={{ color: 'var(--colors-green-500)' }}>Desktop</span>
        </>
      ),
      action: <ActionsPro billing={billing} />,
      subplans: [
        {
          value: 'pro',
          label: 'Pro',
          description: ['Accessible through web browser'],
        },
        {
          value: 'desktop',
          label: 'Desktop',
          description: ['Made for Windows, Mac and Linux'],
        },
      ],
    },
    {
      value: 'enterprise',
      name: 'Enterprise',
      promoted: false,
      label: 'Enterprise',
      action: <ActionsEnterprise />,
      subplans: [
        {
          value: 'enterprise',
          label: 'Enterprise',
          description: [
            'All Pro and Desktop features',
            'Dedicated support and features for larger teams',
          ],
        },
      ],
    },
  ];
}
