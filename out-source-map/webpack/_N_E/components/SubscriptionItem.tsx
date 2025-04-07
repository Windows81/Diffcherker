import React, { useState, useMemo } from 'react';
import Button from 'components/shared/button';
import * as AdminModel from 'models/admin-model';
import { Subscription, SubscriptionStatusType } from 'types/subscription';
import TextInput from './shared/form/text-input';
import css from '../pages/admin.module.css';
import formatNetworkError from 'lib/format-network-error';
import { addDays } from 'date-fns';
import Select from './shared/form/select';

interface SubscriptionItemProps {
  subscription: Subscription;
  onSaveComplete?: (updatedSubscription: Subscription) => void;
  onSaveFailed?: (updater: (prevErrors: string[]) => string[]) => void;
}

const SubscriptionItem: React.FC<SubscriptionItemProps> = ({
  subscription,
  onSaveComplete,
  onSaveFailed,
}) => {
  const [paidThroughDate, setPaidThroughDate] = useState(
    subscription.paidThroughDate.substring(0, 10),
  );
  const [numOfLicenses, setNumOfLicenses] = useState(subscription.quantity);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusType>(subscription.status);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(() => {
    const isPaidThroughDateChanged =
      paidThroughDate !== subscription.paidThroughDate.substring(0, 10);
    const isNumOfLicensesIncreased = numOfLicenses > subscription.quantity;
    const isSubscriptionStatusChanged =
      subscriptionStatus !== subscription.status;

    // This first condition ensures that the admin can never save changes
    // if the number of licenses is below the threshold for any combination.
    return (
      numOfLicenses >= subscription.quantity &&
      (isPaidThroughDateChanged ||
        isNumOfLicensesIncreased ||
        isSubscriptionStatusChanged)
    );
  }, [
    paidThroughDate,
    subscription.paidThroughDate,
    numOfLicenses,
    subscription.quantity,
    subscriptionStatus,
    subscription.status,
  ]);

  const handleSavingError = (error: Error) => {
    if (onSaveFailed) {
      onSaveFailed((prevErrors) => [
        `Error: ${JSON.stringify({
          ...formatNetworkError(error),
          statusText: 'Changes Not Saved',
        })}`,
        ...prevErrors,
      ]);
    } else {
      console.error(error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSubscription = await AdminModel.updateManualSubscription(
        subscription.id,
        {
          paidThroughDate: paidThroughDate,
          numOfLicenses: numOfLicenses,
          status: subscriptionStatus,
        },
      );
      if (onSaveComplete) {
        onSaveComplete(updatedSubscription.data);
      }
    } catch (error) {
      handleSavingError(error as Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={css.subscriptionContainer}>
      <div className={css.subcriptionItemHeader}>
        <div>
          <div className={css.subscriptionId}>
            Subscription ID: <span>{subscription.id}</span>
          </div>
          <div className={css.planId}>
            Plan ID: <span>{subscription.planId}</span>
          </div>
        </div>

        <Button
          style="primary"
          tone="green"
          size="small"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </div>
      <label>
        <div className="section-title">Paid Through Date</div>
        <TextInput
          type="date"
          name="paidThroughDate"
          value={paidThroughDate}
          onChange={(e) => setPaidThroughDate(e.target.value)}
          max="2999-12-31"
          min={addDays(new Date(), 1).toISOString().split('T')[0]}
        />
      </label>
      <label>
        <div className="section-title">Number of Licenses</div>
        <TextInput
          type="number"
          name="numOfLicenses"
          value={numOfLicenses}
          onChange={(e) => {
            setNumOfLicenses(parseInt(e.target.value, 10));
          }}
        />
      </label>
      <label htmlFor="status">
        <div className="section-title">Status</div>
        <Select
          name="status"
          value={subscriptionStatus}
          onChange={(e) =>
            setSubscriptionStatus(e.target.value as SubscriptionStatusType)
          }
        >
          <option value="Active">Active</option>
          <option value="Canceled">Canceled</option>
          <option value="Expired">Expired</option>
          <option value="Past Due">Past Due</option>
          <option value="Pending">Pending</option>
        </Select>
      </label>
    </div>
  );
};

export default SubscriptionItem;
