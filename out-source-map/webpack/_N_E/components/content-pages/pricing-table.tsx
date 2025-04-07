import pricingTableSections from 'lib/pricing-table-sections.json';
import getPricingPlans from 'lib/get-pricing-plans';
import CompareTable, { CompareTableSection } from './compare-table';

interface PricingTableProps {
  billing: 'monthly' | 'yearly';
}

const PricingTable = ({ billing }: PricingTableProps): JSX.Element => {
  return (
    <CompareTable
      plans={getPricingPlans(billing)}
      compareTableSections={pricingTableSections as CompareTableSection[]}
      defaultPlan="pro-desktop"
    />
  );
};

export default PricingTable;
