import React, { useState } from 'react';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import Icon from 'components/shared/icon';
import ChevronSvg from 'components/shared/icons/chevron-down.svg';
import css from './faq-list.module.css';

interface FaqItemProps {
  question: string;
  children: JSX.Element;
}

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  children,
}: FaqItemProps) => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const handleClickQuestion = () => {
    if (collapsed) {
      Tracking.trackEvent('Opened FAQ question', {
        question,
        pathname: router.pathname,
      });
    }
    setCollapsed(!collapsed);
  };
  return (
    <article className={css.faqItem}>
      <h3 className={css.faqItemQuestion}>
        <button aria-expanded={!collapsed} onClick={handleClickQuestion}>
          <div className={css.faqItemIcon}>
            <Icon size="xs" svg={ChevronSvg} />
          </div>
          <div>{question}</div>
        </button>
      </h3>
      <div className={css.faqAnswer} hidden={collapsed}>
        {children}
      </div>
    </article>
  );
};

export default FaqItem;
