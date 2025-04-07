import * as React from 'react';
import css from './plans.module.css';
import { DESKTOP_MONTHLY_21, DESKTOP_YEARLY_180 } from 'lib/plans';
import PlanCard from './plan-card';
import ActionsEnterprise from './actions-enterprise';
import ActionsPro from './actions-pro';
import ActionsBasic from './actions-basic';

interface PlansProps {
  billing: 'monthly' | 'yearly';
  actionsPro?: JSX.Element;
  actionsEnterprise?: JSX.Element;
}

const Plans = ({
  billing,
  actionsPro,
  actionsEnterprise,
}: PlansProps): JSX.Element => {
  return (
    <div className={css.container}>
      <PlanCard
        name={<>Basic</>}
        price="Free"
        priceRate="for everyone"
        description="Industry-leading diff editing tools"
        actions={<ActionsBasic />}
        features={['The most advanced comparison app on the web']}
      />
      <PlanCard
        name={
          <>
            Pro{' '}
            <span style={{ color: 'var(--colors-green-500)' }}>+ Desktop</span>
          </>
        }
        price={`$
              ${
                billing === 'yearly'
                  ? DESKTOP_YEARLY_180.monthlyPrice
                  : DESKTOP_MONTHLY_21.monthlyPrice
              }`}
        priceRate="per user/month"
        description="Full access to all Pro features and the Desktop App"
        actions={actionsPro || <ActionsPro billing={billing} showFooter />}
        features={[
          'Ad-free experience',
          'Advanced text comparing features',
          'Real-time text diff',
          'Improved performance and security',
          'Desktop app for Windows, Mac & Linux',
        ]}
      />
      <PlanCard
        name={<>Enterprise</>}
        price="$40"
        priceRate="per user/month"
        description="All Pro features and Desktop App created for teams of all sizes"
        actions={actionsEnterprise || <ActionsEnterprise showFooter />}
        features={[
          'Everything in Pro+Desktop App',
          'SAML SSO',
          'Account provisioning via SCIM',
          'Dedicated support',
        ]}
      />
    </div>
  );
};

export default Plans;
