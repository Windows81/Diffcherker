import React, { useState } from 'react';
import Page from 'components/new/page';
import Link from 'next/link';
import { useRouter } from 'next/router';
import css from './manual-payment-page.module.css';
import Logo from 'components/content-pages/logo';
import { BuyPaymentMethodSelector } from './payment-method/selector';
import TextInput from 'components/shared/form/text-input';
import { Field } from 'components/shared/form/field';
import { createTransaction, Payload } from 'models/payments-model';
import Button from 'components/shared/button';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';

export type CreateTransactionRequest = {
  paymentAmount: number;
  paymentMethodPayload: Payload;
  email: string;
};

const ManualPaymentPage: React.FC = () => {
  const [paymentMethodPayload, setPaymentMethodPayload] = useState<
    Payload | undefined
  >();
  const [email, setEmail] = useState<string | undefined>();
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>();

  const router = useRouter();

  const paymentAmount = router.query.amount ? Number(router.query.amount) : 0;

  return (
    <Page
      title={'Manual Payment'}
      name={'Manual Payment'}
      hasHeader={false}
      fullWidth
    >
      <div className={css.wrapper}>
        <header className={css.navbar}>
          <div>
            <Link href={'/'} className={css.logo} title="Diffchecker">
              <Logo />
            </Link>
          </div>
        </header>

        <main className={css.main}>
          <h1 className={css.headingLarge}>Manual Payment</h1>
          <div className={css.paymentAmountContainer}>
            <Field label="Payment amount ($)">
              <TextInput
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(paymentAmount)}
                disabled
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                placeholder="john.doe@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </div>

          <div className={css.paymentMethodContainer}>
            <BuyPaymentMethodSelector
              existingPaymentMethodsLoading={false}
              paymentMethods={[]}
              onPaymentMethodChosen={(payload) =>
                setPaymentMethodPayload(payload)
              }
            />
          </div>

          {paymentMethodPayload && (
            <Button
              style="primary"
              tone="green"
              size="large"
              fullWidth
              isLoading={isPurchasing}
              onClick={async () => {
                setIsPurchasing(true);
                setError(undefined);

                // TODO it would be better to just put inputs in <form> and validate natively,
                //      but because BuyPaymentMethodSelector contains a submit button it kind of messes things up and causes a refresh
                //      so a different ui has to be figured out where BuyPaymentMethodSelector lives outside the form
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!email || !emailRegex.test(email)) {
                  setError(new Error('Please enter a valid email address'));
                  setIsPurchasing(false);
                  return;
                }

                try {
                  const request: CreateTransactionRequest = {
                    paymentAmount,
                    paymentMethodPayload,
                    email,
                  };

                  await createTransaction(request);
                  router.push('/download-desktop');
                } catch (e) {
                  setError(normalizeError(e));
                } finally {
                  setIsPurchasing(false);
                }
              }}
            >
              Send Payment
            </Button>
          )}
          {error && (
            <div className={css.messageBoxContainer}>
              <MessageBanner title={error.message} type="error" />
            </div>
          )}
        </main>
      </div>
    </Page>
  );
};

export default ManualPaymentPage;
