import ErrorPage from 'next/error';
import RecentDiffsTesting from 'components/new/recent-diffs/recent-diffs-testing';

const RecentFilesDashBoard = () => {
  return <RecentDiffsTesting />;
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="This page could not be found." statusCode={404} />
  : RecentFilesDashBoard;
