import * as UserActions from 'redux/modules/user-module';
import Button from 'components/shared/button';
import Divider from 'components/shared/divider';
import Dropdown from 'components/shared/dropdown';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';
import type { User } from 'types/user';
import MenuSvg from 'components/shared/icons/menu.svg';
import Avatar from './avatar';
import css from './nav-user-dropdown.module.css';
import cx from 'classnames';
import { t } from 'lib/react-tiny-i18n';

const navItems: Array<{
  url: string;
  title: string;
  tag: string;
  shouldHide?: (user?: User) => boolean;
}> = [
  {
    url: '/account/',
    title: 'Account Settings',
    tag: 'account-settings',
  },
  {
    url: '/account/diffs',
    title: 'Saved Diffs',
    tag: 'saved-diffs',
  },
];

interface NavUserDropdownProps {
  loginUrl: string;
  signupUrl: string;
}

const NavUserDropdown: React.FC<NavUserDropdownProps> = ({
  loginUrl,
  signupUrl,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    Tracking.handleLogout();
    await dispatch(UserActions.logout());
    setIsOpen(false);
    void router.push('/');
  };

  const dropdownProps = {
    display: user ? <Avatar user={user} /> : MenuSvg,
    buttonClassName: user ? css.avatarButton : undefined,
  };

  return (
    <div className={cx(css.navUserDropdown, { [css.noAccount]: !user })}>
      <Dropdown
        isOpen={isOpen}
        setIsOpen={(newState) => {
          setIsOpen(newState);
        }}
        onChange={() => undefined}
        {...dropdownProps}
        rightAlign
      >
        <div className={css.dropdown}>
          {user ? (
            <>
              <div className={css.user}>
                <span className={css.main}>
                  {user.name ? user.name : user.email}
                </span>
                {!!user.name && <span className={css.under}>{user.email}</span>}
              </div>
              <Divider />
              <ul className={css.group}>
                {navItems.map(
                  ({ url, title, tag, shouldHide }) =>
                    !shouldHide?.(user) && (
                      <li key={title}>
                        <Button
                          style="clean"
                          className={css.button}
                          href={url}
                          nextLink
                          data-testid={`nav-user-dropdown-${tag}-button`}
                        >
                          {title}
                        </Button>
                      </li>
                    ),
                )}
              </ul>
              <Divider />
              <Button
                style="clean"
                className={css.button}
                onClick={handleLogout}
                data-testid="nav-user-dropdown-signout-button"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                style="clean"
                className={css.button}
                href={loginUrl}
                nextLink
              >
                {t('Header.signIn')}
              </Button>
              <Button
                style="clean"
                className={css.button}
                href={signupUrl}
                nextLink
              >
                {t('Header.createAccount')}
              </Button>
            </>
          )}
        </div>
      </Dropdown>
    </div>
  );
};

export default NavUserDropdown;
