import css from './api-key-table.module.css';
import { ApiKey } from 'models/api-key-model';

interface AccountSubscriptionPaneApiKeyTableProps {
  apiKey: ApiKey;
}

export const AccountSubscriptionPaneApiKeyTable: React.FC<
  AccountSubscriptionPaneApiKeyTableProps
> = ({ apiKey }) => {
  return (
    <table className={css.table}>
      <thead className={css.thead}>
        <tr className={css.trHead}>
          <th className={css.th}>Api Keys (1)</th>
          <th className={css.th}>Text Diffs</th>
          <th className={css.th}>Image Diffs</th>
          <th className={css.th}>PDF Diffs</th>
        </tr>
      </thead>
      <tbody className={css.tbo}>
        <tr className={css.trBody}>
          <td className={css.td}>{apiKey.value}</td>
          <td>
            {apiKey.diffCounter.text} / {apiKey.limits.text.diffs}
          </td>
          <td>
            {apiKey.diffCounter.image} / {apiKey.limits.image.diffs}
          </td>
          <td>
            {apiKey.diffCounter.pdf} / {apiKey.limits.pdf.diffs}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
