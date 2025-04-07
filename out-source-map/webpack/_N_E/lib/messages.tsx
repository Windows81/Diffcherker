import React from 'react';
import getNetworkErrorCode, {
  isNetworkErrorWithCode,
} from './get-network-error-code';

const errors = {
  DIFF_DOES_NOT_EXIST: 'This diff does not exist. It may have expired.',
  FEEDBACK_DOES_NOT_EXIST: 'This piece of feedback does not exist.',
  USER_DOES_NOT_EXIST: 'This user does not exist.',
  EMAIL_PASSWORD_INCORRECT:
    'Email/password combination is not correct. Please try again.',
  PASSWORD_INCORRECT: 'The password you entered is incorrect',
  JWT_EXPIRED: 'Your session has expired. Please login again.',
  NO_USERNAME: 'Please enter a username.',
  USERNAME_NOT_ALPHANUMERIC:
    'You can only enter letters and numbers in your username.',
  USERNAME_NOT_RIGHT_LENGTH:
    'Your username has to be between 4 and 32 characters.',
  NO_NAME: 'Please enter a name.',
  NO_EMAIL: 'Please enter an email.',
  EMAIL_NOT_VALID: 'Please enter a valid email.',
  INVALID_EMAIL: 'Please enter a valid email.',
  EMAIL_NOT_RIGHT_LENGTH: 'Your email has to be between 5 and 255 characters.',
  NO_PASSWORD: 'Please enter a password.',
  PASSWORD_NOT_LONG_ENOUGH:
    'Your password has to be between 4 and 64 characters.',
  INVALID_PASSWORD: 'Your password has to be between 4 and 64 characters.',
  UNIQUE_VIOLATION: (props: { field: string }) =>
    `There is already an account with this ${props.field}.`,
  EMAIL_AND_PASSWORD_REQUIRED: 'Please enter both your email and your password',
  SIGNED_UP: 'You are now signed up.',
  NOT_LOGGED_IN: 'You must be logged in to do this action.',
  PASSWORD_RESET_EMAIL_SENT: `If an account exists, you will get an email with instructions on resetting your password. If it doesn't arrive, be sure to check your spam folder.`,
  EMAIL_DOES_NOT_EXIST: "We couldn't find an account with that email address.",
  INVALID_RESET_TOKEN:
    'We were not able to reset your password, possibly because your request has expired. Please make another password reset request.',
  UNKNOWN_ERROR:
    'An unknown error occured. Please check your internet connection.',
  LICENSE_KEY_NOT_VALID: 'License key is not valid.',
  LICENSE_KEY_REQUIRED: 'Please provide license key.',
  LICENSE_NOT_FOUND: 'License with the given key does not exist.',
  LICENSE_FORMAT_INCORRECT:
    'License format seems to be incorrect. Your license should be of the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  LICENSE_OFFLINE_FORMAT_INCORRECT:
    'License format seems to be incorrect. Your license should be of the format [XXXX].[XXXXXX].[XXXX] where X could be any number of characters.',
  LICENSE_OFFLINE_MACHINE_INVALID:
    'This license is not valid for this machine. Please contact your company administrator.',
  LICENSE_EXPIRED:
    'Your license has expired. Visit diffchecker.com in order to extend it.',
  LICENSE_REVOKED:
    'Your license has been revoked. Contact us at diffchecker.com/contact for details.',
  LICENSE_PRO_ONLY:
    'Your license is only for the web version of Diffchecker Pro. View our plans at https://www.diffchecker.com/pricing/. You can receive a refund to get the correct plan by contacting admin@diffchecker.com.',
  TRYING_TO_DOUBLE_UP_ON_TRIALS:
    'This computer cannot be used for free trials anymore. Please purchase Diffchecker Desktop at www.diffchecker.com/desktop',
  FIREWALL_ISSUES:
    'Your firewall is causing issues with Diffchecker Desktop. Please whitelist Diffchecker Desktop.',
  DATABASE_CONNECTION_ERROR:
    'There was an error connecting to the database. Please try again.',
  CALL_FOR_AUTHORIZATION:
    'Call your bank to authorize this transaction. There seems to be a hold on your account.',
  ONLY_SSO:
    'This account can only be logged into with Google or Apple, or by resetting the password with "Forgot password".',
  SSO_MISSING_EMAIL: 'An email address is required to continue.',
  SSO_UNKNOWN: 'Something went wrong.',
  EMAIL_ALREADY_TAKEN: 'There is already an account with this email.',
  INVALID_TOKEN:
    'Verification link is not valid - please request email change once again.',
  TOKEN_EXPIRED:
    'Verification link expired - please request email change once again.',
  SAML_UNKNOWN:
    'Something unexpected happened when logging in with SAML SSO - we have been notified, please try again later.',
  USERNAME_NOT_IN_SAML_PROFILE:
    'We could not find userName inside SAML response.',
  FAILED_TO_CREATE_SESSION_SAML:
    'Something unexpected happened when logging in with SAML SSO - we have been notified, please try again later.',
  FAILED_TO_EXTRACT_PROFILE_SAML:
    'Something unexpected happened when logging in with SAML SSO - we have been notified, please try again later.',
  TOO_MANY_LICENSES_FOR_SAML_USER:
    'Something unexpected happened when logging in with SAML SSO - we have been notified, please try again later.',
  MISSING_VALID_LICENSE:
    'Your account does not have a valid license - please contact your organization admin to assign a license to your account.',
  SAML_ISSUER_NOT_VALID_URL:
    'Identity provider is not a valid URL. Please check to make sure the URL you provided is a fully qualified URL.',
  SAML_ENTRY_NOT_VALID_URL:
    'Identity provider Sign on URL is not a valid URL. Please check to make sure the URL you provided is a fully qualified URL.',
  QUANTITY_MUST_BE_PRESENT_AND_POSITIVE:
    'Quantity must be present and positive',
  SUBSCRIPTION_NOT_UPDATEABLE: 'Subscription is not udpateable',
  PLAN_LICENSE_ADDON_NOT_FOUND_ON_SUB:
    'Plan license addon not found on Brain Tree Subscription',
  PLAN_MUST_BE_A_LICENSE_PLAN: 'This plan is not a "license" style plan',
  PLANS_MUST_HAVE_SAME_CYCLE:
    'You can only upgrade plans that have the same billing cycle',
  NO_DIFFERENCE_IN_PLANS:
    'There is no difference between the plans, in type or quantity',
  NO_BRAINTREE_PLAN_FOUND: 'The plan id is missing in Brain Tree',
  TOO_MANY_TOKENS: `This block is beyond the limit of what we can summarize.\n\nOur explain feature is in beta. Please contact us if you'd like a higher limit.`,
  OVER_EXPLAIN_LIMIT: `You are over your explain limit for the day.\n\nOur explain feature is in beta. Please contact us if you'd like a higher limit.`,
  COMMENTING_RESTRICTED: `Comments are restricted on this diff.`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getError = (code: keyof typeof errors | undefined, props: any) => {
  if (typeof code === 'undefined') {
    return 'No error code provided';
  }
  const errorFound = errors[code];
  if (typeof errorFound === 'function') {
    return errorFound(props);
  }
  return errorFound || `Error encountered: ${code}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorByCode = (
  code: string,
  props: { field: string } = { field: 'unknown' },
): string => {
  if (typeof code === 'undefined') {
    return 'No error code provided';
  }

  const errorFound = errors[code as keyof typeof errors];

  if (typeof errorFound === 'function') {
    return errorFound(props);
  }

  return errorFound || `Error encountered: ${code}`;
};

export const normalizeError = <E extends new (message?: string) => Error>(
  unknownErrorType: unknown,
  options: { prepend?: string; ErrorClass?: E } = {
    prepend: '',
  },
): Error => {
  const prepend = options.prepend ? `${options.prepend} ` : '';
  const ErrorClass = options.ErrorClass || Error;

  if (!unknownErrorType) {
    return new ErrorClass(`${prepend}Unknown error.`);
  }

  if (unknownErrorType instanceof Error) {
    return unknownErrorType;
  }

  if (typeof unknownErrorType === 'string') {
    return new ErrorClass(`${prepend}${unknownErrorType}`);
  }

  // From a Network type error
  if (isNetworkErrorWithCode(unknownErrorType)) {
    const networkError = unknownErrorType;
    if (networkError.apiMessage) {
      return new ErrorClass(`${prepend}${networkError.apiMessage}`, {
        cause: networkError,
      });
    }

    return new ErrorClass(
      `${prepend}${getErrorByCode(getNetworkErrorCode(networkError))}`,
      { cause: networkError },
    );
  }

  // Network error object that is wrapped { error: {... } }
  if (
    typeof unknownErrorType === 'object' &&
    'error' in unknownErrorType &&
    isNetworkErrorWithCode(unknownErrorType.error)
  ) {
    const networkError = unknownErrorType.error;
    if (networkError.apiMessage) {
      return new ErrorClass(`${prepend}${networkError.apiMessage}`, {
        cause: networkError,
      });
    }

    return new ErrorClass(
      `${prepend}${getErrorByCode(getNetworkErrorCode(networkError))}`,
      { cause: networkError },
    );
  }

  //Some object with a message on it
  if (
    typeof unknownErrorType === 'object' &&
    'message' in unknownErrorType &&
    unknownErrorType['message'] &&
    typeof unknownErrorType['message'] === 'string'
  ) {
    return new ErrorClass(`${prepend}${unknownErrorType.message}`);
  }

  //Some response object
  if (unknownErrorType instanceof Response) {
    const response = unknownErrorType;
    return new ErrorClass(`${prepend}${unknownErrorType.statusText}`, {
      cause: response,
    });
  }

  return new ErrorClass(`${prepend}Unknown error`);
};

interface MessagesProps {
  code?: string;
  field?: string;
  message?: string;
}

const Messages = (props: MessagesProps) => {
  return (
    <div data-testid="error-message">
      {props.message || getError(props.code as keyof typeof errors, props)}
    </div>
  );
};

export default Messages;
