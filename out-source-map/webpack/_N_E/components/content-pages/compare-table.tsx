import { ReactNode, useState } from 'react';
import css from './compare-table.module.css';
import cx from 'classnames';
import OkSvg from 'components/shared/icons/ok.svg';
import Icon from 'components/shared/icon';
import Dropdown from 'components/shared/dropdown';

export type Plan = {
  value: string;
  name: string;
  promoted: boolean;
  label: string | ReactNode;
  action: ReactNode;
  subplans: {
    value: string;
    label: string;
    description: string[];
  }[];
};

export type CompareTableSection = {
  name: string;
  items: {
    label: string;
    [key: string]: boolean | string;
  }[];
};

interface CompareTableProps {
  plans: Plan[];
  compareTableSections: CompareTableSection[];
  defaultPlan: string;
}

const CompareTable = ({
  plans,
  compareTableSections,
  defaultPlan,
}: CompareTableProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(
    plans.find((plan) => plan.value === defaultPlan) || plans[0],
  );

  return (
    <section className={css.container}>
      <div className={css.planSelector}>
        <Dropdown
          isOpen={isOpen}
          setIsOpen={(newState) => setIsOpen(newState)}
          display={selectedPlan.name}
          onChange={(plan) => {
            setSelectedPlan(
              plans.find((p) => p.value === plan.value) || plans[0],
            );
          }}
          buttonClassName={css.dropdownButton}
          options={plans.map((plan) => ({
            label: plan.name,
            value: plan.value,
          }))}
        />
        {selectedPlan.action}
      </div>
      <div
        className={css.table}
        style={{
          gridTemplateColumns: `repeat(${plans.length + 1}, 1fr)`,
        }}
      >
        <div className={css.column}>
          <div className={css.columnHeader}></div>
          <div className={css.columnBody}>
            <div className={css.columnItems}>
              {compareTableSections.map((section) => (
                <div className={css.columnItemsSection} key={section.name}>
                  <h4 className={css.columnItemsSectionName}>{section.name}</h4>
                  <ul>
                    {section.items.map((item) => (
                      <li className={css.columnItem} key={item.label}>
                        <p className={css.columnItemLabel}>{item.label}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {plans.map((plan) => (
          <div
            className={cx(
              css.column,
              plan.promoted && css.columnRaised,
              plan.value !== selectedPlan.value && css.mobileHidden,
            )}
            key={plan.value}
          >
            <div className={css.columnHeader}>
              <h2 className={css.heading}>{plan.label}</h2>
              {plan.action}
            </div>
            <div className={css.columnsWrapper}>
              {plan.subplans.map((subplan) => (
                <div className={css.columnBody} key={subplan.value}>
                  {subplan.description.length > 0 && (
                    <div className={css.columnDescription}>
                      {subplan.description.map((description) => (
                        <p key={description}>{description}</p>
                      ))}
                    </div>
                  )}
                  <div className={css.columnItems}>
                    {compareTableSections.map((section) => (
                      <div
                        className={css.columnItemsSection}
                        key={section.name}
                      >
                        <h4
                          className={cx(css.columnItemsSectionName, css.hidden)}
                        >
                          {section.name}
                        </h4>
                        <ul>
                          {section.items.map((item) => (
                            <li className={css.columnItem} key={item.label}>
                              {typeof item[
                                subplan.value as keyof typeof item
                              ] === 'boolean' ? (
                                item[subplan.value as keyof typeof item] && (
                                  <span className={css.columnItemIcon}>
                                    <Icon
                                      svg={OkSvg}
                                      size="default"
                                      label={item.label}
                                    />
                                  </span>
                                )
                              ) : (
                                <span>
                                  {
                                    item[
                                      subplan.value as keyof typeof item
                                    ] as string
                                  }
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompareTable;
