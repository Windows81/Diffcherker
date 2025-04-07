import { Field } from 'components/shared/form/field';
import Select from 'components/shared/form/select';
import TextInput from 'components/shared/form/text-input';
import Button from 'components/shared/button';
import braintreeCountries from 'lib/braintree-countries';
import canadianProvinces from 'lib/canadian-provinces';
import usStates from 'lib/us-states';
import { Card } from 'models/payments-model';
import { FC, useState } from 'react';
import css from './billing-address.module.css';
import Tracking from 'lib/tracking';

function getRegionsForCountry(
  country: string,
): Array<{ code: string; name: string }> {
  let regions = [] as Array<{ code: string; name: string }>;
  if (country === 'Canada') {
    regions = canadianProvinces;
  } else if (country === 'United States') {
    regions = usStates;
  } else {
    regions = [];
  }

  return regions;
}

type BuyPaymentMethodBillingAddressFormProps = {
  submitting: boolean;
  onSubmit: (billingAddressDetails: Card) => void;
  onChooseAnotherMethod?: () => void;
};

const BuyPaymentMethodBillingAddressForm: FC<
  BuyPaymentMethodBillingAddressFormProps
> = ({ onSubmit, onChooseAnotherMethod, submitting }) => {
  const [companyName, setCompanyName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');

  return (
    <form
      className={css.billingAddressForm}
      onSubmit={async (event) => {
        event?.preventDefault();
        if (submitting) {
          return;
        }
        Tracking.trackEvent('Clicked add card');
        onSubmit({
          companyName,
          addressLine1,
          addressLine2,
          country,
          city,
          region,
          postalCode,
        });
      }}
    >
      <div className={css.billingAddressFormInner}>
        <Field label="Company Name (optional)">
          <TextInput
            value={companyName}
            onInput={(event) => setCompanyName(event.currentTarget.value)}
          />
        </Field>
        <Field label="Address Line 1">
          <TextInput
            required
            value={addressLine1}
            onInput={(event) => setAddressLine1(event.currentTarget.value)}
          />
        </Field>
        <Field label="Address Line 2">
          <TextInput
            value={addressLine2}
            onInput={(event) => setAddressLine2(event.currentTarget.value)}
          />
        </Field>
        <Field label="Country">
          <Select
            required
            onChange={(event) => setCountry(event.currentTarget.value)}
          >
            {!country && (
              <option value="" disabled selected>
                Select your Country
              </option>
            )}
            {braintreeCountries.map((btCountry) => (
              <option
                key={btCountry}
                value={btCountry}
                selected={country === btCountry}
              >
                {btCountry}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City">
          <TextInput
            required
            value={city}
            onInput={(event) => setCity(event.currentTarget.value)}
          />
        </Field>
        <Field label={country === 'United States' ? 'State' : 'Province'}>
          {getRegionsForCountry(country ?? '').length ? (
            <Select
              required
              onChange={(event) => {
                setRegion(event.currentTarget.value);
              }}
            >
              {!region && (
                <option value="" disabled selected>
                  Select your{' '}
                  {country === 'United States' ? 'State' : 'Province'}
                </option>
              )}
              {getRegionsForCountry(country ?? '').map((r) => (
                <option
                  key={r.code}
                  value={r.code}
                  selected={r.code === region}
                >
                  {r.name}
                </option>
              ))}
            </Select>
          ) : (
            <TextInput
              value={region}
              onInput={(event) => setRegion(event.currentTarget.value)}
            />
          )}
        </Field>
        <Field label={country === 'United States' ? 'Zip Code' : 'Postal Code'}>
          <TextInput
            required
            value={postalCode}
            onInput={(event) => setPostalCode(event.currentTarget.value)}
          />
        </Field>
      </div>

      <div className={css.formButtons}>
        {onChooseAnotherMethod && (
          <Button
            onClick={onChooseAnotherMethod}
            style="secondary"
            tone="base"
            size="large"
            fullWidth
          >
            Choose another method
          </Button>
        )}
        <Button
          type="submit"
          isLoading={submitting}
          style="primary"
          tone="green"
          size="large"
          fullWidth
        >
          Add Card
        </Button>
      </div>
    </form>
  );
};

export default BuyPaymentMethodBillingAddressForm;
