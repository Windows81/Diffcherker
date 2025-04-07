import Button from 'components/button';
import Page from 'components/page';
import ReceiptAddress from 'components/receipt-address';
import { intlFormat } from 'date-fns';
import useRouterTransaction from 'lib/hooks/use-router-transaction';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import { useEffect } from 'react';
import statusMapping from 'types/statusMapping';

import css from './transaction.module.css';

const Transaction: React.FC = () => {
  const { isLoading, transaction } = useRouterTransaction();

  useEffect(() => {
    document.body.classList.add('old');

    return () => {
      document.body.classList.remove('old');
    };
  }, []);

  if (isLoading || !transaction) {
    return <>Loading...</>;
  }

  return (
    <Page name="Transaction" hasHeader={false}>
      <Head>
        <title>{titleTemplate(`Transaction ${transaction.id}`)}</title>
      </Head>
      <div className={css.receipt}>
        <Button onClick={() => window.print()}>Print</Button>
        <h1>Receipt</h1>

        <div className={css.block}>
          <h2>Transaction Information</h2>

          <dl>
            <dt>Merchant</dt>
            <dd>Diffchecker</dd>

            <dt>Amount</dt>
            <dd>
              {transaction.type === 'credit' && '-'}${transaction.amount} USD*
            </dd>

            <dt>Item Purchased</dt>
            <dd>Diffchecker Desktop</dd>

            <dt>Transaction Date</dt>
            <dd>
              {intlFormat(new Date(transaction.createdAt), {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </dd>

            <dt>Transaction ID</dt>
            <dd>{transaction.id}</dd>

            <dt>Status</dt>
            <dd>{statusMapping[transaction.status] || transaction.status}</dd>
          </dl>
        </div>

        <div className={css.block}>
          <h2>Payment Information</h2>

          {transaction.paymentInstrumentType === 'credit_card' ? (
            <dl>
              <dt>Payment Type</dt>
              <dd>Credit Card</dd>
              <dt>Card Type</dt>
              <dd>{transaction.creditCard.cardType}</dd>
              <dt>Credit Card Ends With</dt>
              <dd>{transaction.creditCard.last4}</dd>
            </dl>
          ) : (
            <dl>
              <dt>Payment Type</dt>
              <dd>PayPal Account</dd>
            </dl>
          )}
        </div>

        <div className={css.block}>
          <h2>Customer Information</h2>

          <dl>
            <dt>Email</dt>
            <dd>{transaction.customer.email}</dd>
          </dl>
        </div>

        {transaction.billing.company && (
          <div className={css.block}>
            <h2>Billing Information</h2>

            <dl>
              {transaction.billing.company && (
                <>
                  <dt>Company</dt>
                  <dd>{transaction.billing.company}</dd>
                </>
              )}
              <dt>Billing address line 1</dt>
              <dd>{transaction.billing.streetAddress}</dd>
              {transaction.billing.extendedAddress && (
                <>
                  <dt>Billing address line 2</dt>
                  <dd>{transaction.billing.extendedAddress}</dd>
                </>
              )}
              <dt>City</dt>
              <dd>{transaction.billing.locality}</dd>
              <dt>Province/State</dt>
              <dd>{transaction.billing.region}</dd>
              <dt>Postal/Zip code</dt>
              <dd>{transaction.billing.postalCode}</dd>

              <dt>Country</dt>
              <dd>{transaction.billing.countryName}</dd>
            </dl>
          </div>
        )}

        <ReceiptAddress />
      </div>
    </Page>
  );
};

export default Transaction;
