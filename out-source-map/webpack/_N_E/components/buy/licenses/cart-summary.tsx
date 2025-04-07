import { Plan, isApiPlan, isEnterprisePlan, isProDesktopPlan } from 'lib/plans';
import { useState } from 'react';
import css from './cart-summary.module.css';
import { Subscription } from 'types/subscription';
import { intlFormat } from 'date-fns';
import Badge from 'components/shared/badge';
import cx from 'classnames';

const billingAdverbs: Record<Plan['billing'], string> = {
  month: 'monthly',
  year: 'yearly',
};

type PlanTypeCartHeroProps = {
  basePlan: Plan;
  selectedPlan: Plan;
  savingPlan?: Plan;
};

const PlanTypeCartHero: React.FC<PlanTypeCartHeroProps> = ({
  basePlan,
  selectedPlan,
  savingPlan,
}) => {
  const showSavings = selectedPlan === savingPlan;

  let percentSavings = 0;
  if (savingPlan) {
    percentSavings = savingPlan.percentOffToShow
      ? savingPlan.percentOffToShow
      : Number(
          (
            ((basePlan.monthlyPrice - savingPlan?.monthlyPrice) /
              basePlan.monthlyPrice) *
            100
          ).toFixed(0),
        );
  }

  return (
    <>
      <div>
        <h2 className={css.productTitle}>
          <span className={css.largeText}>Diffchecker</span> <br />
          {isProDesktopPlan(selectedPlan) && (
            <span className={css.productSubtitle}>
              Pro <span className={css.desktopText}>+ Desktop</span>
            </span>
          )}
          {isEnterprisePlan(selectedPlan) && (
            <span className={css.productSubtitle}>
              <span className={css.enterpriseText}>Enterprise</span>
            </span>
          )}
          {isApiPlan(selectedPlan) && (
            <span className={css.productSubtitle}>
              <em className={css.apiText}>{selectedPlan.marketingName}</em>
            </span>
          )}
        </h2>
      </div>
      <div className={css.pricingText}>
        <span className={cx(css.largeText, css.savingText)}>
          {showSavings && (
            <Badge style="secondary" tone="green">
              {percentSavings}% Off
            </Badge>
          )}
          {selectedPlan &&
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(selectedPlan.monthlyPrice)}
        </span>
        <br />
        per month
      </div>
    </>
  );
};

type LineItem = {
  description: string;
  amount: number;
  quantity: number;
};

interface BuySubscriptionCartProps {
  basePlan: Plan;
  savingPlan?: Plan;
  defaultPlan?: Plan;
  existingSubscription?: Subscription;
  additionalLineItems?: LineItem[];
  quantity: number;
  onPlanSelect?: (plan: Plan) => void;
}

const BuyLicensesCartSummary: React.FC<BuySubscriptionCartProps> = ({
  basePlan,
  savingPlan,
  defaultPlan,
  quantity,
  existingSubscription,
  additionalLineItems = [],
  onPlanSelect = () => {
    /* do nothing */
  },
}) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    defaultPlan ?? basePlan ?? savingPlan,
  );
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const basePlanLineItem = {
    description: basePlan.name,
    quantity,
    amount: basePlan.price,
  };

  const planLineItem = {
    description: selectedPlan.name,
    quantity,
    amount: selectedPlan.price,
  };

  const lineItems = [planLineItem, ...additionalLineItems];
  const basePlanLineItems = [basePlanLineItem, ...additionalLineItems];

  const basePlanTotal = basePlanLineItems.reduce(
    (sum, item) => item.amount * item.quantity + sum,
    0,
  );
  const total = lineItems.reduce(
    (sum, item) => item.amount * item.quantity + sum,
    0,
  );

  const showSavings = selectedPlan === savingPlan && !existingSubscription;

  return (
    <div className={css.summaryContainer}>
      <div
        style={{
          display: 'flex',
          gap: '22px',
          justifyContent: 'space-between',
        }}
      >
        <PlanTypeCartHero
          basePlan={basePlan}
          selectedPlan={selectedPlan}
          savingPlan={savingPlan}
        />
      </div>
      <div className={css.billingType}>
        <div>Billing</div>
        {savingPlan ? (
          <div>
            <select
              className={css.billingTypeSelect}
              onChange={(event) => {
                const planToSelect =
                  basePlan.id === event.currentTarget.value
                    ? basePlan
                    : savingPlan;
                setSelectedPlan(planToSelect);
                onPlanSelect(planToSelect);
              }}
            >
              <option selected={selectedPlan == basePlan} value={basePlan.id}>
                {billingAdverbs[basePlan.billing]}
              </option>
              <option
                selected={selectedPlan == savingPlan}
                value={savingPlan.id}
              >
                {billingAdverbs[savingPlan.billing]}
              </option>
            </select>
          </div>
        ) : (
          <div>{billingAdverbs[basePlan.billing]}</div>
        )}
      </div>
      {existingSubscription && (
        <div>
          <table className={css.existingSubscriptionTable}>
            <tbody>
              <tr className={css.lineItem}>
                <td>Total licenses</td>
                <td>{existingSubscription.quantity + quantity}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(
                    selectedPlan.price *
                      (existingSubscription.quantity + quantity),
                  )}{' '}
                  / {selectedPlan.billing}
                </td>
              </tr>
              <tr>
                <td>Renews</td>
                <td>
                  {intlFormat(new Date(existingSubscription.renewsOn), {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <hr />
      {showBreakdown && !!lineItems.length && (
        <div>
          <table className={css.lineItemsTable}>
            <tbody>
              {lineItems.map((_, i) => {
                return (
                  <tr key={i}>
                    <td>{_.description}</td>
                    <td>x{_.quantity}</td>
                    <td>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(_.amount * _.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: '22px',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <strong>
            {existingSubscription ? 'To be charged today' : 'Total'}
          </strong>
        </div>

        <div>
          {showSavings && (
            <span className={css.basePrice}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(
                basePlanTotal * (selectedPlan.billing === 'year' ? 12 : 0),
              )}
            </span>
          )}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(total)}
        </div>
      </div>
      <div>
        {!!total && lineItems.length > 1 && (
          <button
            className="anchor-style"
            onClick={() => {
              setShowBreakdown(!showBreakdown);
            }}
          >
            {showBreakdown ? 'Hide breakdown' : 'Show breakdown...'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BuyLicensesCartSummary;
