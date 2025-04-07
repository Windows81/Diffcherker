import Link from 'next/link';
import React from 'react';
import css from './faq-list.module.css';
import FaqItem from './faq-item';

function FaqDesktop() {
  return (
    <div className={css.faq}>
      <FaqItem question="Will I receive an invoice for my purchase?">
        <p>
          Yes. After purchasing Diffchecker Desktop, your invoice will be
          available under the &apos;Subscription&apos; panel in your Diffchecker
          user account. The receipt will include the last 4 digits of your
          credit card number, purchase date, transaction ID, your name, email,
          company name and address (if provided) and our business number.
        </p>
      </FaqItem>
      <FaqItem question="Can I use Diffchecker Desktop on multiple devices?">
        <>
          <p>
            Yes! You can use your Diffchecker Desktop license on three devices
            simultaneously, however you must be the primary user of each device.
            This way, you can keep using Diffchecker Desktop even if you replace
            your PC or use different computers at home and at work.{' '}
          </p>
          <p>
            You can also change computers and your license will automatically
            move to the new device.
          </p>
        </>
      </FaqItem>
      <FaqItem question="How can I distribute Diffchecker Desktop licenses to my employees?">
        <>
          <p>
            If you have purchased multiple licenses, they can be assigned to
            employee Diffchecker accounts in the &apos;Subscription&apos; panel
            of your Diffchecker user profile page. Each assignment will generate
            a link that your employee can use to redeem the license.
          </p>
        </>
      </FaqItem>
      <FaqItem question="Do subscriptions auto-renew?">
        <p>
          Your subscription will automatically renew on a monthly or yearly
          basis, depending on the plan you have chosen. If you cancel your plan,
          it will not renew at the end of your subscription cycle. It will end
          once the period you have paid for is over.
        </p>
      </FaqItem>
      <FaqItem question="How can I cancel my subscription?">
        <p>
          You can cancel your subscription in your account settings. You will be
          able to use Diffchecker Desktop until the period you have paid for is
          over.
        </p>
      </FaqItem>
      <FaqItem question="How do I request a refund?">
        <p>
          To request a refund, please fill out{' '}
          <Link href="/contact">our contact form</Link> within 30 days of your
          purchase. We&apos;ll send you a confirmation email as soon as your
          license has been cancelled. Refunds can take up to 7 days to appear in
          your account.
        </p>
      </FaqItem>
      <FaqItem question="Does Diffchecker Desktop have an EULA?">
        <p>
          Yes. To access the Diffchecker Desktop End User License Agreement
          (EULA), please go to{' '}
          <Link href="/diffchecker-desktop-eula">
            the Diffchecker Desktop EULA
          </Link>
          .
        </p>
      </FaqItem>
    </div>
  );
}

export default FaqDesktop;
