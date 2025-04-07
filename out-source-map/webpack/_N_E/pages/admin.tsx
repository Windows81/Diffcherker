import { isFulfilled } from '@reduxjs/toolkit';
import cx from 'classnames';
import Page from 'components/new/page';
import Button from 'components/shared/button';
import Select from 'components/shared/form/select';
import TextInput from 'components/shared/form/text-input';
import PlusCircleSVG from 'components/shared/icons/plus-circle.svg';
import MessageBanner from 'components/shared/message-banner';
import SegmentedSwitch from 'components/shared/segmented-switch';
import withSession from 'components/with-session';
import formatNetworkError from 'lib/format-network-error';
import { jwtEncode } from 'lib/jwt-encode';
import {
  API_MONTHLY_299,
  API_MONTHLY_99,
  ApiPlan,
  DESKTOP_MONTHLY_21,
  DESKTOP_YEARLY_180,
  ENTERPRISE_YEARLY,
  LicensePlan,
  allowedManualPlans,
  getAllowedManualPlanPrice,
} from 'lib/plans';
import titleTemplate from 'lib/title-template';
import * as AdminModel from 'models/admin-model';
import ErrorPage from 'next/error';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateFeatures } from 'redux/modules/app-module';
import { deleteDiff } from 'redux/modules/diff-module';
import * as PaymentsActions from 'redux/modules/payments-module';
import { deleteUser } from 'redux/modules/user-module';
import { getUserRole } from 'redux/selectors/user-selector';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import CloseTabSVG from 'static/images/close-tab.svg';
import { PlanTier, Subscription } from 'types/subscription';
import css from './admin.module.css';
import SubscriptionItem from 'components/SubscriptionItem';

interface SingleInputActionProps {
  id: string;
  action: (id: string) => void;
  title: string;
  onActionComplete?: (title: string, value: string) => void;
  onActionFailed?: (title: string, value: string, error: unknown) => void;
}
const SingleInputAction: React.FC<SingleInputActionProps> = ({
  id,
  action,
  title,
  onActionComplete,
  onActionFailed,
}) => {
  const [value, setValue] = useState<string>('');
  const [requestState, setRequestState] = useState<
    'idle' | 'loading' | 'error'
  >('idle');

  return (
    <div className={css.inputAction}>
      <div>
        <label className="section-title">{title}</label>
        <br />
        <input
          className={css.input}
          type="text"
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <Button
        style="primary"
        tone="red"
        isLoading={requestState === 'loading'}
        disabled={!value}
        onClick={async () => {
          if (!value || requestState === 'loading') {
            return;
          }
          try {
            setRequestState('loading');
            await action(value);
            setRequestState('idle');
            onActionComplete && onActionComplete(title, value);
            setValue('');
          } catch (error) {
            console.error(error);
            onActionFailed && onActionFailed(title, value, error);
            setRequestState('error');
          }
        }}
      >
        delete
      </Button>
    </div>
  );
};

const Admin: React.FC = () => {
  const dispatch = useAppDispatch();
  const userRole = useSelector(getUserRole);
  const features = useAppSelector((state: State) => state.app.features);
  const [deletionLog, setDeletionLog] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('deletion');

  const [editableFeatures, setEditableFeatures] = useState<string>(
    JSON.stringify(features, null, 2),
  );

  const [isSavingFeatures, setIsSavingFeatures] = useState<boolean>(false);

  if (userRole !== 'admin') {
    return <ErrorPage title="Forbidden" statusCode={403} />;
  }

  const handleInputActionCompleted = (title: string, value: string) =>
    setDeletionLog([`${title} completed for ${value}.`, ...deletionLog]);

  const handleInputActionFailed = (
    title: string,
    value: string,
    error: unknown,
  ) => {
    console.log(typeof error);
    setDeletionLog([
      `${title} failed for ${value}. Error: ${
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message ?? 'Unknown'
      }`,
      ...deletionLog,
    ]);
  };

  return (
    <Page name="Admin" title={titleTemplate('Admin')}>
      <div className={css.container}>
        <h1 className={css.header}>Diffchecker Admin</h1>

        <MessageBanner
          className={css.banner}
          type="error"
          title="Be sure you know what you're doing!"
          message={`Fiddling around these parts can be dangerous if you don't know what you're doing.\nBe sure to talk to someone who does before changing anything!`}
        />
        <SegmentedSwitch
          options={[
            { value: 'deletion', label: 'Deletion' },
            { value: 'features', label: 'Feature Flags' },
            { value: 'manualLicense', label: 'Manual License' },
            { value: 'machineLicense', label: 'Machine License' },
            { value: 'mySubscription', label: 'My Subscription' },
          ]}
          selectedValue={selectedTab}
          onClick={(option) => setSelectedTab(option.value)}
        />
        {selectedTab === 'deletion' && (
          <section className={css.section}>
            <div className={css.pane}>
              <div className={css.actionsLogsContainer}>
                <div className={css.actions}>
                  <SingleInputAction
                    action={async (value) =>
                      await dispatch(
                        deleteUser({ idOrEmail: Number(value) }),
                      ).unwrap()
                    }
                    id="userId"
                    title="Delete user by id"
                    onActionComplete={handleInputActionCompleted}
                    onActionFailed={handleInputActionFailed}
                  />
                  <SingleInputAction
                    action={async (value) =>
                      await dispatch(deleteUser({ idOrEmail: value })).unwrap()
                    }
                    id="email"
                    title="Delete user by email"
                    onActionComplete={handleInputActionCompleted}
                    onActionFailed={handleInputActionFailed}
                  />
                  <SingleInputAction
                    action={async (value) =>
                      await dispatch(deleteDiff({ slug: value })).unwrap()
                    }
                    id="diffId"
                    title="Delete diff by id"
                    onActionComplete={handleInputActionCompleted}
                    onActionFailed={handleInputActionFailed}
                  />
                </div>
                <div className={css.logs}>
                  <label className="section-title">
                    Deletion Log
                    <br />
                    <textarea
                      className={css.textarea}
                      rows={10}
                      value={deletionLog.join('\n')}
                      readOnly
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}
        {selectedTab === 'features' && features && (
          <section className={css.section}>
            <div className={css.pane}>
              <textarea
                value={editableFeatures}
                rows={10}
                cols={50}
                onInput={(event) =>
                  setEditableFeatures(event.currentTarget.value)
                }
              />
              <br />
              <Button
                style="primary"
                tone="green"
                isLoading={isSavingFeatures}
                onClick={async () => {
                  try {
                    setIsSavingFeatures(true);
                    await dispatch(
                      updateFeatures(JSON.parse(editableFeatures)),
                    ).unwrap();
                  } catch (e) {
                    window.alert(
                      'Error, please check your JSON or make sure that you have the admin role. If you just recently applied the admin role, make sure to logout and log back in.',
                    );
                  } finally {
                    setIsSavingFeatures(false);
                  }
                }}
              >
                Save features
              </Button>
            </div>
          </section>
        )}
        {selectedTab === 'manualLicense' && <ManualLicenseSection />}
        {selectedTab === 'machineLicense' && <MachineLicenseSection />}
        {selectedTab === 'mySubscription' && <EditLicenseSection />}
      </div>
    </Page>
  );
};

// Adding enum in case we need to add more states in the future
enum ManualLicenseFormState {
  CREATE = 'create',
  UPDATE = 'update',
}

const ManualLicenseSection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const userRef = React.useRef<HTMLInputElement>(null);
  const planRef = React.useRef<HTMLSelectElement>(null);
  const seatsRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);
  const [action, setAction] = useState<ManualLicenseFormState>(
    ManualLicenseFormState.CREATE,
  );
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [manualSubscriptions, setManualSubscriptions] = useState<
    Subscription[]
  >([]);

  const clearForm = () => {
    if (userRef.current) {
      userRef.current.value = '';
    }
    if (seatsRef.current) {
      seatsRef.current.value = '';
    }
    if (endDateRef.current) {
      endDateRef.current.value = '';
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      setIsLoading(true);

      const idOrEmail = userRef.current?.value.trim() || '';
      const planIndex = Number(planRef.current?.value) || 0;
      const plan = allowedManualPlans[planIndex];
      const planId = plan.id;
      const price = getAllowedManualPlanPrice(plan) || 0;
      const quantity = Number(seatsRef.current?.value) || 0;
      const paidThroughDate = endDateRef.current?.value || '';

      if (action === ManualLicenseFormState.CREATE) {
        const { data: subscription } = await AdminModel.addManualSubscription({
          idOrEmail,
          planId,
          price,
          quantity,
          paidThroughDate,
        });

        setLog([`Success: ${JSON.stringify(subscription)}`, ...log]);
        clearForm();
      } else if (action === ManualLicenseFormState.UPDATE) {
        const subscriptions =
          await AdminModel.findManualSubscriptions(idOrEmail);
        setManualSubscriptions(subscriptions.data);
        setHasSearched(true);
      }
    } catch (e) {
      setLog([`Error: ${JSON.stringify(formatNetworkError(e))}`, ...log]);
      setHasSearched(false);
      setManualSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { value } = e.target;
    if (value === ManualLicenseFormState.CREATE) {
      setHasSearched(false);
      setManualSubscriptions([]);
    }
    clearForm();
    setAction(value as ManualLicenseFormState);
  };

  const handleSaveComplete = (updatedSubscription: Subscription) => {
    setManualSubscriptions((prevSubscriptions) =>
      prevSubscriptions.map((sub) =>
        sub.id === updatedSubscription.id ? updatedSubscription : sub,
      ),
    );
    setLog([`Success: ${JSON.stringify(updatedSubscription)}`, ...log]);
  };

  return (
    <section className={css.section}>
      <div className={css.pane}>
        <form className={css.form}>
          <div className={css.manualLicenseSection}>
            <div className={css.form}>
              <span>
                <div className="section-title">Action</div>
                <Select
                  name="action"
                  value={action}
                  onChange={(e) => handleActionChange(e)}
                >
                  <option value={ManualLicenseFormState.CREATE}>
                    Create new subscription
                  </option>
                  <option value={ManualLicenseFormState.UPDATE}>
                    Update existing subscription
                  </option>
                </Select>
              </span>
              <label>
                <div className="section-title">User ID or Email</div>
                <TextInput ref={userRef} />
              </label>
              {action === ManualLicenseFormState.CREATE && (
                <>
                  <span>
                    <div className="section-title">Plan</div>
                    <Select ref={planRef}>
                      {allowedManualPlans.map((plan, index) => (
                        <option key={index} value={index}>
                          {plan.name}: {plan.id}
                        </option>
                      ))}
                    </Select>
                  </span>

                  <label>
                    <div className="section-title">Seats</div>
                    <TextInput ref={seatsRef} type="number" />
                  </label>

                  <label>
                    <div className="section-title">Paid Through Date</div>
                    <TextInput ref={endDateRef} type="date" max="2999-12-31" />
                  </label>
                </>
              )}
              <div className={css.buttons}>
                <Button
                  style="primary"
                  tone="green"
                  size="large"
                  type="submit"
                  isLoading={isLoading}
                  onClick={handleSubmit}
                >
                  {action === ManualLicenseFormState.CREATE
                    ? 'Add subscription'
                    : 'Find subscriptions'}
                </Button>
              </div>
            </div>
            <div className={css.manualLicenseLogContainer}>
              <div className="section-title">Log</div>
              <textarea
                className={css.textarea}
                value={log.join('\n\n')}
                readOnly
              />
            </div>
          </div>
          <div className={css.form}>
            {manualSubscriptions.length > 0 ? (
              <>
                <span className={css.formHeader}>Subscriptions</span>
                {manualSubscriptions.map((subscription) => (
                  <SubscriptionItem
                    key={subscription.id}
                    subscription={subscription}
                    onSaveComplete={handleSaveComplete}
                    onSaveFailed={setLog}
                  />
                ))}
              </>
            ) : hasSearched ? (
              <span className={css.formHeader}>No subscriptions found</span>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
};

const MachineLicenseSection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  const machineIdRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);

  const clearForm = () => {
    /* noop */
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      setIsLoading(true);

      const machineId = machineIdRef.current?.value.trim() || '';
      const paidThroughDate = endDateRef.current?.value || '';

      if (!paidThroughDate) {
        throw new Error('Select an expiry date');
      }

      const jwt = jwtEncode({
        machineId,
        expiresAt: new Date(paidThroughDate).toISOString(),
        isOfflineLicense: true,
        allows: 'access',
        isTrial: false,
        isRevoked: false,
        maxMachines: 1,
      });

      setCounter((i) => i + 1);

      setLog([
        ...log,
        `(${counter}) License for machine\n${machineId}\n\n${jwt}\n\n`,
      ]);
      clearForm();
    } catch (e) {
      setLog([...log, `Error: ${JSON.stringify(formatNetworkError(e))}\n`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={css.section}>
      <div className={css.pane}>
        <div className={css.manualLicenseSection}>
          <form className={css.form} onSubmit={handleSubmit}>
            <label>
              <div className="section-title">Machine ID</div>
              <TextInput ref={machineIdRef} />
            </label>

            <label>
              <div className="section-title">Expires At</div>
              <TextInput ref={endDateRef} type="date" max="2999-12-31" />
            </label>

            <div className={css.buttons}>
              <Button
                style="primary"
                tone="green"
                size="large"
                type="submit"
                isLoading={isLoading}
              >
                Create Machine License
              </Button>
            </div>
          </form>
          <div className={css.manualLicenseLogContainer}>
            <div className="section-title">Log</div>
            <textarea
              style={{ minHeight: 400 }}
              className={css.textarea}
              value={log.join('\n')}
              readOnly
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface SubscriptionConfig {
  planType: PlanTier;
  renewalDate: string;
  selfAdministered: boolean;
  autoRenew: boolean;
  frequency: 'monthly' | 'annually';
  numberOfLicenses: number;
}

interface ApiPlanConfig {
  renewalDate: string;
  autoRenew: boolean;
  planType: 'none' | 'standard' | 'business' | 'custom';
}

const initialSubscription: SubscriptionConfig = {
  planType: 'free',
  renewalDate: '',
  selfAdministered: false,
  autoRenew: false,
  frequency: 'monthly',
  numberOfLicenses: 1,
};

const initialApiPlan: ApiPlanConfig = {
  renewalDate: '',
  autoRenew: false,
  planType: 'none',
};

function getPlan(
  planType: string,
  frequency?: string,
): LicensePlan | ApiPlan | undefined {
  switch (planType) {
    case 'enterprise':
      return ENTERPRISE_YEARLY;
    case 'pro':
      return frequency === 'monthly' ? DESKTOP_MONTHLY_21 : DESKTOP_YEARLY_180;
    case 'standard':
      return API_MONTHLY_99;
    case 'business':
      return API_MONTHLY_299;
  }
}

const EditLicenseSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  const [subscriptionFormData, setSubscriptionFormData] = useState<
    SubscriptionConfig[]
  >([]);
  const [apiFormData, setApiFormData] = useState<ApiPlanConfig>(initialApiPlan);
  const [isFetchingSubscriptions, setIsFetchingSubscriptions] = useState(true);

  useEffect(() => {
    const fetchInitialSubscriptions = async () => {
      const currentSubs = await dispatch(PaymentsActions.getMySubscriptions());
      const currentTrial = await dispatch(PaymentsActions.getMyTrial());
      const startingSubs: SubscriptionConfig[] = [];
      if (isFulfilled(currentSubs) && currentSubs.payload.length > 0) {
        for (const sub of currentSubs.payload) {
          if (sub.planId.indexOf('api') > -1) {
            const apiObject: ApiPlanConfig = {
              planType:
                sub.planId === 'api-monthly-99' ? 'standard' : 'business',
              renewalDate: sub.paidThroughDate.substring(0, 10),
              autoRenew: sub.neverExpires,
            };
            setApiFormData(apiObject);
          } else {
            const subObject: SubscriptionConfig = {
              planType: sub.planTier,
              renewalDate: sub.paidThroughDate.substring(0, 10),
              selfAdministered:
                sub.licenses.length > 0
                  ? sub.licenses[0].ownerId === sub.userId
                  : false,
              autoRenew: sub.neverExpires,
              frequency:
                sub.planId.indexOf('monthly') > -1 ? 'monthly' : 'annually',
              numberOfLicenses: sub.quantity,
            };
            startingSubs.push(subObject);
          }
        }
      }

      if (isFulfilled(currentTrial)) {
        const trialObject: SubscriptionConfig = {
          planType: 'trial',
          renewalDate: currentTrial.payload.expiresAt.substring(0, 10),
          selfAdministered: false,
          autoRenew: false,
          frequency: 'monthly',
          numberOfLicenses: 1,
        };
        startingSubs.push(trialObject);
      }
      setSubscriptionFormData(startingSubs);
      setIsFetchingSubscriptions(false);
    };

    setIsFetchingSubscriptions(true);
    fetchInitialSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubFormChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type } = e.target;
    const value: boolean | string =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    // Extract the actual name for radio buttons
    const actualName = type === 'radio' ? name.split('-')[0] : name;

    const updatedSubscriptions = subscriptionFormData.map((subscription, i) => {
      if (i !== index) {
        return subscription;
      }

      let updatedSubscription = { ...subscription, [actualName]: value };

      if (actualName === 'planType' && value === 'enterprise') {
        updatedSubscription = { ...updatedSubscription, frequency: 'annually' };
      }

      return updatedSubscription;
    });

    setSubscriptionFormData(updatedSubscriptions);
  };

  const handleApiFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type } = e.target;
    const value: boolean | string =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    const updatedPlan = { ...apiFormData, [name]: value };

    setApiFormData(updatedPlan as ApiPlanConfig);
  };

  const addSubscription = () => {
    setSubscriptionFormData([
      ...subscriptionFormData,
      { ...initialSubscription },
    ]);
  };

  const removeSubscription = (index: number) => {
    setSubscriptionFormData(subscriptionFormData.filter((_, i) => i !== index));
  };

  const handleSubmitSubscriptions = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    try {
      await dispatch(PaymentsActions.deleteAllSubsLicensesTrials()).unwrap();
    } catch (error) {
      console.error('Error deleting subscriptions and licenses', error);
    }

    for (const subscription of subscriptionFormData) {
      switch (subscription.planType) {
        case 'free':
          // don't create anything for a free subscription
          break;
        case 'trial':
          await dispatch(PaymentsActions.createTrial());
          await dispatch(
            PaymentsActions.adminExtendTrial({
              userId: String(user?.id) || '',
              newExpiresAt: subscription.renewalDate,
            }),
          );
          break;
        case 'pro':
        case 'enterprise':
          try {
            const plan = getPlan(
              subscription.planType,
              subscription.frequency,
            )! as LicensePlan;
            await AdminModel.addManualSubscription({
              idOrEmail: String(user?.id) || '',
              planId: plan.id,
              price: getAllowedManualPlanPrice(plan) || plan.monthlyPrice,
              quantity: subscription.numberOfLicenses,
              paidThroughDate: subscription.renewalDate,
              autoRenew: subscription.autoRenew,
            });
          } catch (e) {
            console.error('Error creating subscription', e);
          }
          break;
      }
    }

    if (apiFormData && apiFormData.planType !== 'none') {
      try {
        const plan = getPlan(apiFormData.planType);
        if (!plan) {
          throw new Error('Invalid plan type - ' + apiFormData.planType);
        }
        await AdminModel.addManualSubscription({
          idOrEmail: String(user?.id) || '',
          planId:
            apiFormData.planType === 'standard'
              ? 'api-monthly-99'
              : 'api-monthly-299',
          price: getAllowedManualPlanPrice(plan) || plan.price,
          quantity: 1,
          paidThroughDate: apiFormData.renewalDate,
          autoRenew: apiFormData.autoRenew,
        });
      } catch (e) {
        console.error('Error creating API subscription', e);
      }
    }
  };

  return (
    <section className={css.section}>
      <span className={css.subHeader}>({user && user.email}) </span>
      {isFetchingSubscriptions && <div>Fetching Subscriptions...</div>}
      <div className={css.pane}>
        <form onSubmit={handleSubmitSubscriptions} className={css.form}>
          <span className={css.formHeader}>Subscriptions</span>
          {subscriptionFormData.map((subscription, index) => (
            <div className={css.subscriptionContainer} key={index}>
              <div className={css.subscriptionHeader}>
                <div className="section-title">Plan Type:</div>
                <span>
                  <div className={css.selectWrapper}>
                    <Select
                      name="planType"
                      value={subscription.planType}
                      onChange={(e) => handleSubFormChange(index, e)}
                    >
                      <option value="free">Free</option>
                      <option value="trial">Trial</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </Select>
                  </div>
                  <Button
                    onClick={() => removeSubscription(index)}
                    style="secondary"
                    tone="base"
                    size="large"
                    className={css.closeButton}
                  >
                    <CloseTabSVG />
                  </Button>
                </span>
              </div>
              {subscription.planType !== 'free' && (
                <label>
                  <div className="section-title">
                    {subscription.autoRenew === false ||
                    subscription.planType === 'trial'
                      ? 'Paid Through Date'
                      : 'Renewal Date'}
                    :
                  </div>
                  <TextInput
                    type="date"
                    name="renewalDate"
                    value={subscription.renewalDate}
                    onChange={(e) => handleSubFormChange(index, e)}
                    max="2999-12-31"
                  />
                </label>
              )}
              {(subscription.planType === 'pro' ||
                subscription.planType === 'enterprise') && (
                <>
                  <div>
                    <label>
                      <div className="section-title">Frequency</div>
                      <div
                        className={cx(
                          css.radioButtonContainer,
                          subscription.planType === 'enterprise' &&
                            css.radioButtonContainerGrey,
                        )}
                      >
                        <label>
                          <input
                            type="radio"
                            name={`frequency-${index}`}
                            value="monthly"
                            checked={subscription.frequency === 'monthly'}
                            disabled={subscription.planType === 'enterprise'}
                            onChange={(e) => handleSubFormChange(index, e)}
                          />
                          Monthly
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`frequency-${index}`}
                            value="annually"
                            checked={
                              subscription.frequency === 'annually' ||
                              subscription.planType === 'enterprise'
                            }
                            disabled={subscription.planType === 'enterprise'}
                            onChange={(e) => handleSubFormChange(index, e)}
                          />
                          Annually
                        </label>
                      </div>
                    </label>
                  </div>
                  <label className={css.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="autoRenew"
                      checked={subscription.autoRenew}
                      onChange={(e) => handleSubFormChange(index, e)}
                    />
                    Auto-renew
                  </label>
                  <label className={css.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="selfAdministered"
                      checked={subscription.selfAdministered}
                      onChange={(e) => handleSubFormChange(index, e)}
                    />
                    Self-managed
                  </label>
                  <label>
                    <div className="section-title">Number of Licenses:</div>
                    <TextInput
                      type="number"
                      name="numberOfLicenses"
                      value={subscription.numberOfLicenses}
                      onChange={(e) => handleSubFormChange(index, e)}
                    />
                  </label>
                </>
              )}
            </div>
          ))}
          <Button
            type="button"
            style="text"
            tone="base"
            size="large"
            onClick={addSubscription}
            className={css.addSubscriptionButton}
          >
            <div className={css.addSubscriptionButtonText}>
              <PlusCircleSVG />
              Add Subscription
            </div>
          </Button>
          <span className={css.formHeader}>API Plan</span>
          <span>
            <div className="section-title">Plan Type:</div>
            <Select
              name="planType"
              value={apiFormData?.planType}
              onChange={(e) => handleApiFormChange(e)}
            >
              <option value="none">None</option>
              <option value="standard">Standard</option>
              <option value="business">Business</option>
              <option value="custom">Custom</option>
            </Select>
          </span>
          {apiFormData.planType !== 'none' && (
            <>
              <label>
                <div className="section-title">
                  {apiFormData.autoRenew === false
                    ? 'Paid Through Date'
                    : 'Renewal Date'}
                  :
                </div>
                <TextInput
                  type="date"
                  name="renewalDate"
                  value={apiFormData.renewalDate}
                  onChange={(e) => handleApiFormChange(e)}
                  max="2999-12-31"
                />
              </label>
              <label className={css.checkboxLabel}>
                <input
                  type="checkbox"
                  name="autoRenew"
                  checked={apiFormData.autoRenew}
                  onChange={(e) => handleApiFormChange(e)}
                />
                Auto-renew
              </label>
            </>
          )}

          <Button style="primary" tone="green" type="submit" size="large">
            Save Changes
          </Button>
        </form>
      </div>
    </section>
  );
};

export default withSession(Admin);
