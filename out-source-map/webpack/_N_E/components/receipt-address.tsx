import css from './receipt-address.module.css';

const ReceiptAddress: React.FC = () => {
  return (
    <div className={css.wrapper}>
      <div className={css.bold}>Checker Software Inc.</div>
      <div>407 - 13955 Laurel Dr.</div>
      <div>Surrey, BC</div>
      <div>Canada</div>
      <div>V3T 1A8</div>
      <div>admin@diffchecker.com</div>
      <div>Business #: 792298085 RC 0001</div>
      <div>
        * VAT/GST paid directly by Checker Software Inc., where applicable
      </div>
      <div>{'https://www.diffchecker.com/contact'}</div>
    </div>
  );
};

export default ReceiptAddress;
