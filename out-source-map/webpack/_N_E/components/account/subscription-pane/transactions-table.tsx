import { OurTransaction } from 'types/transaction';
import css from './transactions-table.module.css';
import cx from 'classnames';
import { addDays, format } from 'date-fns';
interface AccountSubscriptionPaneTransactionsTableProps {
  transactions?: OurTransaction[];
}

export const AccountSubscriptionPaneTransactionsTable: React.FC<
  AccountSubscriptionPaneTransactionsTableProps
> = ({ transactions = [] }) => {
  return !transactions.length ? (
    <p>No Transactions Found!</p>
  ) : (
    <table className={css.table}>
      <thead className={css.thead}>
        <tr className={css.tr}>
          <th className={css.th}>ID</th>
          <th className={css.th}>Date</th>
          <th className={css.th}>Payment Method</th>
          <th className={css.th}>Amount</th>
          <th className={css.th}>Documents</th>
        </tr>
      </thead>
      <tbody className={css.tbo}>
        {transactions.map((transaction) => (
          <tr key={transaction.id} className={css.tr}>
            <td className={css.td}>{transaction.id}</td>
            <td className={css.td}>
              {format(
                addDays(new Date(transaction.createdAt), 1),
                'MMMM do yyyy',
              )}
            </td>
            <td className={css.td}>
              {transaction.paymentInstrumentType === 'paypal_account'
                ? 'PayPal'
                : `${transaction.creditCard.cardType} •••• ${transaction.creditCard.last4}`}
            </td>
            <td className={css.td}>USD ${transaction.amount}</td>
            <td className={css.td}>
              <a
                className={cx(css.documentsLink, 'anchor-style')}
                href={`/transaction?id=${transaction.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Receipt
              </a>
              <a
                className="anchor-style"
                href={`/invoice?id=${transaction.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Invoice
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
