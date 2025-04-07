import cx from 'classnames';
import CancelSvg from 'components/shared/icons/cancel.svg';
import usePrevious from 'lib/hooks/use-previous';
import React, {
  ComponentType,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Modal as ReactResponsiveModal } from 'react-responsive-modal';

import IconButton from './icon-button';
import css from './modal.module.css';
import LoadingOverlay from './loaders/loading-overlay';

export interface BaseModalProps {
  title?: string;
  isOpen: boolean;
  maxWidth?: string;
  minWidth?: string;
  classNames?: { overlay?: string; modal?: string };
  initialFocusRef?: React.RefObject<HTMLElement>;
  isLoading?: boolean;
  noCloseButton?: boolean;
  noPadding?: boolean;
  stateless?: boolean;
  diffBackgroundColor?: boolean;
  didOpen?: () => void;
  didClose?: () => void;
}

export interface NotifyingCloseModalProps extends BaseModalProps {
  didClose: () => void;
}

interface CloseableModalProps extends BaseModalProps {
  closeModal: () => void;
  noCloseButton?: undefined | false;
}

interface NonCloseableModalProps extends BaseModalProps {
  closeModal?: undefined;
  noCloseButton: true;
}

type ModalProps = CloseableModalProps | NonCloseableModalProps;

const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  isLoading = false,
  isOpen,
  didOpen = () => {
    /* do nothing */
  },
  didClose = () => {
    /* do nothing */
  },
  ...props
}) => {
  const prevIsOpen = usePrevious(isOpen);
  const isClosing = prevIsOpen === true && isOpen === false;

  const prevProps = usePrevious(props);
  const propsToUse = !isOpen && prevProps ? prevProps : props; // prevents modal from changing while closing via animation, TODO: better way to handle?
  const {
    title,
    closeModal,
    minWidth = '392px',
    maxWidth = '392px',
    classNames,
    initialFocusRef,
    noCloseButton,
    noPadding,
    children,
    diffBackgroundColor,
  } = propsToUse;

  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <ReactResponsiveModal
        classNames={{
          overlay: cx(classNames?.overlay, css.overlay),
          modal: cx('new-modal', classNames?.modal, css.modal, {
            [css.noPadding]: noPadding,
            [css.settingsModal]: diffBackgroundColor,
          }),
        }}
        styles={{ modal: { maxWidth, minWidth } }}
        open={isOpen}
        center
        onClose={() => closeModal?.()} // the types say no args, but it technically passes something so we need to make sure we ignore it
        showCloseIcon={false}
        ref={ref}
        initialFocusRef={initialFocusRef || ref}
        onAnimationEnd={() => (isClosing ? didClose() : didOpen())}
      >
        <div className={css.container}>
          <div
            className={cx(css.header, {
              [css.withTitle]: title !== undefined,
            })}
          >
            {title !== undefined && (
              <h2
                className={cx(css.title, {
                  [css.noCloseButton]: noCloseButton,
                })}
              >
                {title}
              </h2>
            )}
          </div>
          <div className={cx(css.content)}>{children}</div>
          {!noCloseButton && (
            <IconButton
              style="text"
              tone="base"
              svg={CancelSvg}
              onClick={() => closeModal()}
              className={css.closeButton}
              aria-label="Close modal"
            />
          )}
        </div>
        {isLoading && <LoadingOverlay />}
      </ReactResponsiveModal>
    </>
  );
};

export default Modal;

interface StatelessModalProps {
  isOpen: boolean;
  didClose?: () => void;
}

export function makeStateless<P>(
  Component: ComponentType<P>,
): React.FC<Omit<P, 'didClose'> & StatelessModalProps> {
  const WrappedComponent = ({
    isOpen,
    didClose = () => {
      /** do nothing */
    },
    ...restProps
  }: StatelessModalProps): ReactElement => {
    const Modal = Component;
    const [shouldRender, setShouldRender] = useState<boolean>(false);
    const prevIsOpen = usePrevious(isOpen);

    useEffect(() => {
      const isOpening = !prevIsOpen && isOpen === true;

      if (isOpening) {
        setShouldRender(true);
      }
    }, [isOpen, prevIsOpen]);

    // Use ComponentProps to get the prop types of the specified component
    return shouldRender ? (
      <Modal
        isOpen={isOpen}
        didClose={() => {
          didClose();
          setShouldRender(false);
        }}
        {...(restProps as P)}
      />
    ) : (
      <></>
    );
  };

  return WrappedComponent;
}
