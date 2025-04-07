import * as React from 'react';
import * as DiffActions from 'redux/modules/diff-module';
import * as UserActions from 'redux/modules/user-module';
import Alert from 'components/alert';
import Button from 'components/button';
import ImageRetina from 'components/imageRetina';
import withSession from 'components/with-session';
import { defaults, text, dimensions } from 'css/variables';
import { intlFormat, intlFormatDistance } from 'date-fns';
import usePrevious from 'lib/hooks/use-previous';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';
import Page from 'components/page';

interface AccountDiffProps extends DiffActions.SavedDiff {
  index: number;
  deleteDiff: (slug: string) => void;
}

const AccountDiff: React.FC<AccountDiffProps> = (props) => {
  const handleClick = () => {
    props.deleteDiff(props.slug);
  };
  const createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
  const expires = props.expires ? new Date(props.expires) : new Date();
  return (
    <tr>
      <td className="diff-icon-column">
        <div className="diff-icon">
          <ImageRetina format="webp" src="text-small" />
        </div>
      </td>
      <td className="diff-name">
        <Button href={`/${props.slug}`} type="clean">
          {props.title || props.slug}
        </Button>
      </td>
      {/* <td>200 years ago</td> {/* please change */}
      <td
        title={intlFormat(createdAt, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      >
        {intlFormatDistance(createdAt, new Date())}
      </td>
      <td
        title={intlFormat(expires, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      >
        {props.expires === null
          ? 'never'
          : `${intlFormatDistance(expires, new Date())}`}
      </td>
      <td className="actions">
        <div className="button">
          {/* TODO these buttons cause a page refresh tho they probably shouldn't - this might help solve it: https://nextjs.org/learn/basics/dynamic-routes/page-path-external-data  */}
          <Button href={`/${props.slug}`} type="lighter" autoWidth>
            Open
          </Button>
        </div>
        <div className="button">
          <Button type="danger" autoWidth onClick={handleClick}>
            Delete
          </Button>
        </div>
      </td>
      <style jsx>{`
        .diff-icon-column {
          width: 58px;
          padding-right: 0;
        }
        tr {
          text-align: left;
          font-size: ${text.label.default.size};
          line-height: 20px;
          border-bottom: 15px solid var(--back-strongest);
        }
        td {
          padding: 20px 10px 20px 0;
        }
        td:not(:last-child) {
          background: var(--back-stronger);
        }
        td:first-child {
          border-radius: ${defaults.borderRadius} 0 0 ${defaults.borderRadius};
        }
        td:nth-last-child(2) {
          border-radius: 0 ${defaults.borderRadius} ${defaults.borderRadius} 0;
        }
        .diff-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: inline-block;
          background: var(--back-strongest);
          padding: 6px;
          margin: 0 10px 2px 10px;
          vertical-align: middle;
          display: inline-block;
        }
        .diff-name {
          font-size: ${text.title.small.size};
          font-weight: ${text.title.weight};
        }
        .actions {
          display: flex;
          padding: 0;
          line-height: 60px;
        }
        .actions .button {
          width: calc(50% - 5px);
          margin-left: 10px;
          display: flex;
        }
        .actions .button:hover {
          text-decoration: none;
        }
      `}</style>
    </tr>
  );
};

const AccountDiffs: React.FC = React.memo(function AccountDiffs() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const diffs = useAppSelector((state) => state.user.diffs);

  const previousUser = usePrevious(user);

  const getDiffs = useCallback(() => {
    if (user?.id) {
      dispatch(UserActions.getDiffs({ id: user.id }));
    }
  }, [dispatch, user]);

  const deleteDiff = async (slug: string) => {
    await dispatch(DiffActions.deleteDiff({ slug }));
    getDiffs();
  };

  useEffect(() => {
    // getDiffs on initial load or when initial load has no user at first then logs the user in TODO: make this cleaner
    if (typeof window !== undefined && !previousUser && user) {
      getDiffs();
    }
  }, [previousUser, user, getDiffs]);

  return (
    <Page name="Saved Diffs">
      <Head>
        <title>{titleTemplate('Diffs')}</title>
      </Head>
      <div className="account">
        <div className="account-body">
          <div className="account-diffs">
            <h2>Saved diffs</h2>
            {diffs.length > 0 ? (
              <table className="diff-list">
                <thead>
                  <tr>
                    <th> </th>
                    <th> </th>
                    {/* <th>Last opened</th> */}
                    <th>Created</th>
                    <th>Expires</th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((diff, index) => (
                    <AccountDiff
                      key={diff.slug}
                      {...diff}
                      index={index}
                      deleteDiff={deleteDiff}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <Alert type="info">You haven&apos;t saved any diffs yet.</Alert>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .diff-list {
          width: 100%;
        }
        .diff-list tr:nth-child(even) {
          background: var(--front-default);
        }
        .diff-list tr th {
          text-align: left;
          font-size: ${text.label.default.size};
          font-weight: ${text.label.bold.weight};
          padding-bottom: 15px;
        }
        .account {
          display: flex;
          box-sizing: border-box;
          max-width: ${dimensions.content.width};
          background: var(--back-stronger);
          border-radius: ${defaults.borderRadius};
          margin: 0 auto;
        }
        .account-body {
          flex-grow: 1;
          min-height: 540px;
          min-width: 680px;
          padding: 20px 30px 30px;
          border-radius: ${defaults.borderRadius};
          background: var(--back-strongest);
          box-shadow: ${defaults.shadowSoft};
        }
      `}</style>
    </Page>
  );
});

export default withSession(AccountDiffs);
