import * as React from 'react';
import OkSvg from 'components/shared/icons/ok.svg';
import css from './plan-card.module.css';
import Icon from 'components/shared/icon';

interface PlanCardProps {
  name: JSX.Element;
  price: string;
  priceRate: string;
  description: string;
  actions: JSX.Element;
  features: string[];
}

const PlanCard = ({
  name,
  price,
  priceRate,
  description,
  actions,
  features,
}: PlanCardProps): JSX.Element => {
  return (
    <div className={css.container}>
      <div className={css.details}>
        <div className={css.priceSection}>
          <h2 className={css.planName}>{name}</h2>
          <p className={css.price}>{price}</p>
          <p className={css.textSecondary}>{priceRate}</p>
        </div>
        <p className={css.description}>{description}</p>
        {actions}
      </div>
      <ul className={css.featuresList}>
        {features.map((feature) => (
          <li className={css.featuresListItem} key={feature}>
            <span className={css.featuresListItemIcon}>
              <Icon svg={OkSvg} size="default" />
            </span>
            <span className={css.featuresListItemText}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanCard;
