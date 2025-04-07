export type Plan<T extends object = object> = T & {
  id: string;
  name: string;
  marketingName: string;
  billing: 'month' | 'year';
  type: 'license' | 'api';
  unitDescription: 'license' | 'api key' | 'users';
  monthlyPrice: number;
  price: number;
  saving?: string;
  deprecated: boolean;
  percentOffToShow?: number;
};
export type SavingPlan = Omit<Plan, 'billing'> & {
  saving: string;
  billing: 'year';
};
export type LicensePlan = Omit<Plan, 'type'> & { type: 'license' };
export type ApiPlan = Omit<Plan, 'type'> & { type: 'api' };
export type LicenseSavingPlan = SavingPlan & Omit<LicensePlan, 'billing'>;
export type PerpetualPlan = Plan<{
  startingPrice: number;
  updatesPrice: number;
  discounts: {
    [key: string]: unknown;
  };
}>;

export const DESKTOP_PERPETUAL: PerpetualPlan = {
  id: 'desktop-perpetual',
  name: 'Desktop',
  marketingName: 'Desktop Perpetual',
  startingPrice: 49,
  updatesPrice: 24.5,
  billing: 'year',
  type: 'license',
  unitDescription: 'license',
  discounts: {
    DIFFTOGETHER: {
      startingPrice: 24.5,
    },
  },
  monthlyPrice: 2.04,
  price: 24.5,
  deprecated: true,
};

export const DESKTOP_YEARLY_180: LicenseSavingPlan = {
  id: 'desktop-yearly-180',
  name: 'Desktop',
  marketingName: 'Pro + Desktop',
  monthlyPrice: 15,
  price: 180,
  billing: 'year',
  saving: '29%',
  type: 'license',
  unitDescription: 'license',
  deprecated: false,
};

export const DESKTOP_MONTHLY_21: LicensePlan = {
  id: 'desktop-monthly-21',
  name: 'Desktop',
  marketingName: 'Pro + Desktop',
  monthlyPrice: 21,
  price: 21,
  billing: 'month',
  type: 'license',
  unitDescription: 'license',
  deprecated: false,
};

export const DESKTOP_ACCESS_YEARLY: LicenseSavingPlan = {
  id: 'desktop-access-yearly',
  name: 'Desktop',
  marketingName: 'Desktop Access',
  monthlyPrice: 9,
  price: 108,
  billing: 'year',
  saving: '25%',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const DESKTOP_ACCESS_MONTHLY: LicensePlan = {
  id: 'desktop-access-monthly',
  name: 'Desktop',
  marketingName: 'Desktop Access',
  monthlyPrice: 12,
  price: 12,
  billing: 'month',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const PRO_ACCESS_YEARLY: LicenseSavingPlan = {
  id: 'pro-access-yearly',
  name: 'Pro',
  marketingName: 'Pro Access',
  monthlyPrice: 6,
  price: 72,
  billing: 'year',
  saving: '25%',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const PRO_ACCESS_MONTHLY: LicensePlan = {
  id: 'pro-access-monthly',
  name: 'Pro',
  marketingName: 'Pro Access',
  monthlyPrice: 8,
  price: 8,
  billing: 'month',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const DESKTOP_PRO_MONTHLY_5__DEPRECATED: LicensePlan = {
  id: 'desktop-pro-monthly-5',
  name: 'Desktop Pro',
  marketingName: 'Pro + Dekstop',
  monthlyPrice: 5,
  price: 5,
  billing: 'year',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const DESKTOP_PRO_YEARLY_49__DEPRECATED: LicensePlan = {
  id: 'desktop-pro-yearly-49',
  name: 'Desktop Pro',
  marketingName: 'Pro + Dekstop',
  monthlyPrice: 4.08,
  price: 49,
  billing: 'year',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const DESKTOP_YEARLY_19__DEPRECATED: LicensePlan = {
  id: 'desktop-yearly-19',
  name: 'Desktop',
  marketingName: 'Pro + Dekstop',
  monthlyPrice: 1.58,
  price: 19,
  billing: 'year',
  type: 'license',
  unitDescription: 'license',
  deprecated: true,
};

export const API_MONTHLY_99: ApiPlan = {
  id: 'api-monthly-99',
  name: 'API Basic',
  marketingName: 'API Basic',
  monthlyPrice: 99,
  price: 99,
  billing: 'month',
  type: 'api',
  unitDescription: 'api key',
  deprecated: false,
};

export const API_MONTHLY_299: ApiPlan = {
  id: 'api-monthly-299',
  name: 'API Premium',
  marketingName: 'API Premium',
  monthlyPrice: 299,
  price: 299,
  billing: 'month',
  type: 'api',
  unitDescription: 'api key',
  deprecated: false,
};

export const ENTERPRISE_YEARLY: LicensePlan = {
  id: 'enterprise-yearly',
  name: 'Enterprise',
  marketingName: 'Enterprise',
  monthlyPrice: 40,
  price: 480,
  billing: 'year',
  type: 'license',
  unitDescription: 'users',
  deprecated: false,
};

const plans: Plan[] = [
  DESKTOP_YEARLY_180,
  DESKTOP_MONTHLY_21,
  DESKTOP_PERPETUAL,
  DESKTOP_ACCESS_MONTHLY,
  DESKTOP_ACCESS_YEARLY,
  PRO_ACCESS_MONTHLY,
  PRO_ACCESS_YEARLY,
  DESKTOP_PRO_MONTHLY_5__DEPRECATED,
  DESKTOP_PRO_YEARLY_49__DEPRECATED,
  DESKTOP_YEARLY_19__DEPRECATED,
  API_MONTHLY_99,
  API_MONTHLY_299,
  ENTERPRISE_YEARLY,
];

export const apiPlans: Plan[] = [API_MONTHLY_99, API_MONTHLY_299];

export const proDesktopPlans: Plan[] = [
  DESKTOP_YEARLY_180,
  DESKTOP_MONTHLY_21,
  DESKTOP_PERPETUAL,
  DESKTOP_ACCESS_MONTHLY,
  DESKTOP_ACCESS_YEARLY,
  PRO_ACCESS_MONTHLY,
  PRO_ACCESS_YEARLY,
  DESKTOP_PRO_MONTHLY_5__DEPRECATED,
  DESKTOP_PRO_YEARLY_49__DEPRECATED,
  DESKTOP_YEARLY_19__DEPRECATED,
];

export const enterprisePlans: Plan[] = [ENTERPRISE_YEARLY];

export const PlanLookup: Record<string, Plan> = plans.reduce(
  (lookup, plan) => {
    lookup[plan.id] = plan;
    return lookup;
  },
  {} as Record<string, Plan>,
);

// plans that are allowed to be assigned manually via the admin panel, as calculating deprecated plan pricing is more complicated (monthly/yearly not separate)
export const allowedManualPlans: Plan[] = [
  ENTERPRISE_YEARLY,
  DESKTOP_YEARLY_180,
  DESKTOP_MONTHLY_21,
  DESKTOP_ACCESS_MONTHLY,
  DESKTOP_ACCESS_YEARLY,
  PRO_ACCESS_MONTHLY,
  PRO_ACCESS_YEARLY,
  API_MONTHLY_99,
  API_MONTHLY_299,
];

// will not work properly with deprecated plans
export const getAllowedManualPlanPrice = (plan: Plan): number | undefined => {
  let price: number | undefined;

  if ('monthlyPrice' in plan && typeof plan.monthlyPrice === 'number') {
    price = plan.monthlyPrice;
  } else if ('price' in plan && typeof plan.price === 'number') {
    price = plan.price;
  }

  if (price && plan.billing === 'year') {
    price = price * 12;
  }

  return price;
};

export function isProDesktopPlan(plan: Plan): boolean {
  return proDesktopPlans.includes(plan);
}

export function isEnterprisePlan(plan: Plan): boolean {
  return enterprisePlans.includes(plan);
}

export function isApiPlan(plan: Plan): boolean {
  return apiPlans.includes(plan);
}

export function isPlanOnOffer(plan: Plan): boolean {
  return !plan.deprecated;
}

export default plans;
