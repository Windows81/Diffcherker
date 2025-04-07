import { type OurTransaction } from 'types/transaction';

import { type OurPaymentMethod } from './payment-method';
import { type User } from './user';
import { License } from './license';
import { ApiKey } from 'models/api-key-model';

export type SubscriptionStatusType =
  | 'Active'
  | 'Canceled'
  | 'Expired'
  | 'Pending'
  | 'Past Due';

export type PlanTier = 'enterprise' | 'pro' | 'trial' | 'api' | 'free';

export const PlanTierHumanizedMap: Record<PlanTier, string> = {
  enterprise: 'Enterprise',
  pro: 'Pro',
  trial: 'Pro Trial',
  api: 'API',
  free: 'Free',
};

export interface Subscription {
  transactions: OurTransaction[];
  paymentMethod?: OurPaymentMethod;
  id: string;
  name: string;
  price: string;
  status: SubscriptionStatusType;
  planId: string;
  quantity: number;
  paidThroughDate: string;
  renewsOn: string;
  neverExpires: boolean;
  lastNotificationTimestamp?: string;
  nextBillingPeriodAmount?: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  user_id: number;
  renewedIntoId: string | null;
  licenses?: License[];
  apiKey?: ApiKey;
  planTier: PlanTier;
  isManual: boolean;
  transactionsLoaded?: boolean;
}
