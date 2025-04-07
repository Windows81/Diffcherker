import * as OrganizationActions from 'redux/modules/organization-module';
import Button from 'components/shared/button';
import withSession from 'components/with-session';

import createApiUrl from 'lib/create-api-url';
import titleTemplate from 'lib/title-template';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';

import Skeletons from 'components/shared/loaders/skeletons';
import Skeleton from 'components/shared/loaders/skeleton';
import { Field } from 'components/shared/form/field';
import CopyReadonly from 'components/new/copy-readonly';
import TextInput from 'components/shared/form/text-input';
import Page from 'components/new/page';
import css from './organization.module.css';
import TextArea from 'components/shared/form/text-area';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';
import Breadcrumbs from 'components/shared/navigation/breadcrumbs';
import Breadcrumb from 'components/shared/navigation/breadcrumb';
import Icon from 'components/shared/icon';
import OkCircleSvg from 'components/shared/icons/ok-circle.svg';
import Link from 'next/link';
import ChevronRightSvg from 'components/shared/icons/chevron-right.svg';

const Organization: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [error, setError] = useState<Error | undefined>();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const organization = useAppSelector(
    (state) => state.organization.organization,
  );

  const [samlCertificate, setSamlCertificate] = useState<string>('');
  const [samlIssuer, setSamlIssuer] = useState<string>('');
  const [samlEntryPoint, setSamlEntrypoint] = useState<string>('');

  const samlSsoConfigured = useAppSelector(
    (state) => state.organization.samlSsoConfigured,
  );

  const saveSamlConfiguration = useCallback(
    async (
      samlCertificate: string,
      samlIssuer: string,
      samlEntryPoint: string,
    ) => {
      setError(undefined);
      setIsSaving(true);

      try {
        await dispatch(
          OrganizationActions.setSamlConfiguration({
            samlCertificate,
            samlEntryPoint,
            samlIssuer,
          }),
        ).unwrap();
      } catch (error) {
        setError(normalizeError(error));
        return;
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch],
  );

  const clearSamlConfiguration = useCallback(async () => {
    setError(undefined);
    setIsClearing(true);

    try {
      await dispatch(OrganizationActions.clearSamlConfiguration()).unwrap();
    } catch (error) {
      setError(normalizeError(error));
      return;
    } finally {
      setIsClearing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(OrganizationActions.getMine())
      .unwrap()
      .catch((err) => {
        if ([401, 404].includes(err.status)) {
          router.push('/');
          return;
        }
        setError(err);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSamlCertificate(organization?.samlCertificate || '');
    setSamlIssuer(organization?.samlIssuer || '');
    setSamlEntrypoint(organization?.samlEntryPoint || '');
  }, [organization]);

  if (!organization) {
    return (
      <Skeletons>
        <Skeleton size="large" />
        <Skeleton size="large" />
        <Skeleton size="large" />
      </Skeletons>
    );
  }

  return (
    <Page name="Configure SAML SSO" title={titleTemplate('Configure SAML SSO')}>
      <div className={css.configureSamlSso}>
        <Breadcrumbs>
          <Breadcrumb href="/">Home</Breadcrumb>
          <Breadcrumb href="/account">Account Settings</Breadcrumb>
          <Breadcrumb href="/account/organization">
            Configure SAML SSO
          </Breadcrumb>
        </Breadcrumbs>
        <h2>Configure SAML SSO</h2>
        <div className={css.serviceProviderDetails}>
          <h3>Diffchecker service provider details</h3>
          <div className={css.pane}>
            <Field label="Diffchecker ASC URL">
              <CopyReadonly
                value={createApiUrl(`/auth/saml/acs/orgs/${organization.id}`)}
                buttonProps={{
                  size: 'default',
                  style: 'secondary',
                  tone: 'base',
                }}
              />
            </Field>
            <Field label="Diffchecker entity ID">
              <CopyReadonly
                value="http://www.diffchecker.com/saml/metadata"
                buttonProps={{
                  size: 'default',
                  style: 'secondary',
                  tone: 'base',
                }}
              />
            </Field>
          </div>
        </div>

        <div className={css.serviceProviderDetails}>
          <h3>Provisioning</h3>
          <div className={css.pane}>
            <Field label="SCIM URL">
              <CopyReadonly
                value={createApiUrl(`/auth/scim/v2/orgs/${organization.id}`)}
                buttonProps={{
                  size: 'default',
                  style: 'secondary',
                  tone: 'base',
                }}
              />
            </Field>
            <Field label="User Identifier field">
              <CopyReadonly
                value="userName"
                buttonProps={{
                  size: 'default',
                  style: 'secondary',
                  tone: 'base',
                }}
              />
            </Field>
            <Field label="Authentication mode">
              <TextInput value="HTTP Header" readOnly />
            </Field>
            <Field label="SCIM API Key">
              <CopyReadonly
                value={organization.scimApiKey}
                buttonProps={{
                  size: 'default',
                  style: 'secondary',
                  tone: 'base',
                }}
              />
            </Field>
          </div>
        </div>

        <div className={css.serviceProviderDetails}>
          <h3>Identity provider details</h3>
          <div className={css.pane}>
            <Field label="Identity provider Sign on URL">
              <TextInput
                placeholder="https://"
                value={samlEntryPoint}
                onInput={(event) => {
                  setSamlEntrypoint(event.currentTarget.value);
                }}
              />
            </Field>
            <Field label="Identity provider issuer">
              <TextInput
                placeholder="https://"
                value={samlIssuer}
                onInput={(event) => {
                  setSamlIssuer(event.currentTarget.value);
                }}
              />
            </Field>
            <Field label="Signing certificate">
              <TextArea
                value={samlCertificate}
                rows={5}
                onInput={(event) => {
                  setSamlCertificate(event.currentTarget.value);
                }}
              />
            </Field>
          </div>
          {error && (
            <div className={css.errors}>
              <MessageBanner title={error.message} type="error" />
            </div>
          )}
        </div>

        <div className={css.buttons}>
          <Button
            isLoading={isSaving}
            style="primary"
            tone="green"
            size="large"
            onClick={() => {
              saveSamlConfiguration(
                samlCertificate,
                samlIssuer,
                samlEntryPoint,
              );
            }}
          >
            Save configuration
          </Button>
          <Button
            isLoading={isClearing}
            style="secondary"
            tone="base"
            size="large"
            onClick={() => clearSamlConfiguration()}
          >
            Clear configuration
          </Button>
        </div>
        {samlSsoConfigured && (
          <div className={css.configuredContainer}>
            <span className={css.configured}>
              <Icon svg={OkCircleSvg} /> Single Sign-On is enabled.{'  '}&nbsp;
              <Link href="/account" className={css.returnLink}>
                Return to account settings{' '}
                <Icon size="xs" svg={ChevronRightSvg} />
              </Link>
            </span>
          </div>
        )}
      </div>
    </Page>
  );
};

export default withSession(Organization);
