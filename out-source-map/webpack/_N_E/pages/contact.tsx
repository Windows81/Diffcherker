import * as FeedbackActions from 'redux/modules/feedback-module';
import React, { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';
import Page from 'components/new/page';
import Button from 'components/shared/button';
import TextInput from 'components/shared/form/text-input';
import css from './contact.module.css';
import TextArea from 'components/shared/form/text-area';
import MessageBanner from 'components/shared/message-banner';
import titleTemplate from 'lib/title-template';

enum PageState {
  DEFAULT,
  SUCCESS,
  ERROR,
}

const ContactPage: React.FC = () => {
  const emailUsedAsLogin = useAppSelector((state) => state.user.user?.email);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const [pageState, setPageState] = useState(PageState.DEFAULT);
  const [message, setMessage] = useState('');
  const [typed, setTyped] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(
      FeedbackActions.createFeedback({
        name: nameRef.current?.value,
        phone: phoneRef.current?.value,
        email: emailRef.current?.value,
        company: companyRef.current?.value,
        message,
        userAgent: navigator.userAgent,
        emailUsedAsLogin,
      }),
    )
      .unwrap()
      .then(() => {
        setPageState(PageState.SUCCESS);
      })
      .catch(() => {
        setPageState(PageState.ERROR);
      });
  };

  return (
    <Page name="Contact" title={titleTemplate('Contact')} fullWidth>
      <main className={css.main}>
        <section className={css.contactCard}>
          <h1 className={css.contactTitle}>Contact Us</h1>
          {pageState === PageState.DEFAULT ? (
            <>
              <p className={css.contactDesc}>
                We&apos;d love to hear from you!
              </p>
              <form onSubmit={handleSubmit}>
                <label className={css.name}>
                  Name
                  <TextInput
                    placeholder="Name (optional)"
                    ref={nameRef}
                    type="text"
                  />
                </label>
                <label className={css.phone}>
                  Phone
                  <TextInput
                    type="tel"
                    placeholder="Phone (optional)"
                    ref={phoneRef}
                  />
                </label>
                <label className={css.email}>
                  Email
                  <TextInput
                    defaultValue={emailUsedAsLogin}
                    type="email"
                    placeholder="Email (optional)"
                    ref={emailRef}
                  />
                </label>
                <label className={css.company}>
                  Company
                  <TextInput
                    placeholder="Company (optional)"
                    ref={companyRef}
                  />
                </label>
                <label htmlFor="contact-message" className={css.messageBox}>
                  Message <span className={css.required}>*</span>
                  <TextArea
                    id="contact-message"
                    placeholder={
                      typed && message.length === 0
                        ? 'Message (Required)'
                        : 'Message'
                    }
                    required
                    onChange={(e) => {
                      setTyped(true);
                      setMessage(e.target.value);
                    }}
                    error={typed && message.length === 0}
                  />
                </label>
                <Button
                  style="primary"
                  tone="green"
                  size="large"
                  type="submit"
                  className={css.submit}
                >
                  Send Message
                </Button>
              </form>
            </>
          ) : pageState === PageState.SUCCESS ? (
            <FeedbackMessage
              type="success"
              title="Your message has been sent"
              message="We will get back to you as soon as possible."
            />
          ) : (
            <FeedbackMessage
              type="error"
              title="Your message has not been sent"
              message="Please try again later."
            />
          )}
        </section>
      </main>
    </Page>
  );
};

const FeedbackMessage = ({
  type,
  title,
  message,
}: {
  type: 'success' | 'error';
  title: string;
  message: string;
}) => {
  return (
    <div className={css.msgContainer}>
      <MessageBanner
        type={type}
        title={title}
        message={message}
        className={css.banner}
      />
      <Button
        style="primary"
        tone="green"
        size="large"
        prefetch={false}
        nextLink
        href={'/'}
      >
        Back to homepage
      </Button>
    </div>
  );
};

export default ContactPage;
