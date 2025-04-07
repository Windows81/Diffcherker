import * as React from 'react';
import { DESKTOP_YEARLY_180 } from 'lib/plans';
import css from './billing-toggle.module.css';
import SegmentedSwitch from 'components/shared/segmented-switch';
import Badge from 'components/shared/badge';

interface BillingToggleProps {
  onChange: (billing: 'monthly' | 'yearly') => void;
  billing: 'monthly' | 'yearly';
}

const BillingToggle = (props: BillingToggleProps): JSX.Element => {
  interface Option {
    value: 'monthly' | 'yearly';
    label: string;
    badge?: JSX.Element;
  }

  const options: Option[] = [
    { value: 'monthly', label: 'Monthly' },
    {
      value: 'yearly',
      label: 'Yearly',
      badge: (
        <Badge style="secondary" tone="green">
          {DESKTOP_YEARLY_180.saving} off
        </Badge>
      ),
    },
  ];

  return (
    <div className={css.wrapper}>
      <SegmentedSwitch
        selectedValue={props.billing}
        options={options}
        onClick={(option) => props.onChange(option.value)}
      />
    </div>
  );
};

export default BillingToggle;
