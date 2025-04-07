import apiTableSections from 'lib/api-table-sections.json';
import apiPlans from 'lib/api-plans';
import CompareTable, { CompareTableSection } from './compare-table';

const ApiTable = (): JSX.Element => {
  return (
    <CompareTable
      plans={apiPlans}
      compareTableSections={apiTableSections as CompareTableSection[]}
      defaultPlan="standard"
    />
  );
};

export default ApiTable;
