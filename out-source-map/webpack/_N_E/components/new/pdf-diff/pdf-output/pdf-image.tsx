import cx from 'classnames';
import { PdfImageDiffResult } from 'lib/compare-pdf-images';
import { NewOutputType, PdfImageDiffOutputTypes } from 'lib/output-types';
import * as React from 'react';
import { DraggableData } from 'react-draggable';
import { ImageEvent, ImageState } from 'types/image-diff';
import PdfDiffOutputImage from 'components/pdf-diff-output-image';
import MessageBanner from 'components/shared/message-banner';
import sharedCss from './pdf-output-shared.module.css';
import css from './pdf-image.module.css';
import PdfSidebar from './pdf-sidebar';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import Tab from 'components/shared/tab';
import DiffOutputTypeSwitch from 'components/new/diff-output-type-switch';
import PdfImageTools from '../pdf-image-tools';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import DocumentSvg from 'components/shared/icons/document.svg';
import ImageSvg from 'components/shared/icons/image.svg';
import { DiffSettingsButton } from 'components/new/text-diff-output/settings';
import { DiffInputType } from 'types/diff-input-type';
import { DiffFeature } from 'lib/diff-features';
import { useDesktopModal } from 'components/new/desktop-modal/context';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import {
  ExportType,
  ExportProgressState,
  ExportProgress,
} from './commands/image-export-types-and-selectors';
import Modal from 'components/shared/modal';
import ExportErrorMessageBanner from '../../../shared/export-error-message-banner';
import { t } from 'lib/react-tiny-i18n';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImageLoadingProps {}

const ImageLoading: React.FC<ImageLoadingProps> = () => {
  return (
    <div className={cx(sharedCss.output, sharedCss.grey, sharedCss.loader)}>
      <LoadingCircle style="secondary" />
      <span className={sharedCss.mainLoadingText}>Loading results...</span>
      <span>
        Diffchecker is creating images and computing differences for each page.
      </span>
      <span>In case of larger documents, it may take some time.</span>
    </div>
  );
};

interface ImageOutputContainerProps {
  imageDiffData?: PdfImageDiffResult[];
  outputImageType: PdfImageDiffOutputTypes;
  imageState: ImageState;
  imageShowEqualPages: boolean;
  outputImageTypes: NewOutputType<PdfImageDiffOutputTypes>[];
  imageEventHandler: (e: ImageEvent, dragData?: DraggableData) => void;
  handleOutputImageTypeChange: (imageType: PdfImageDiffOutputTypes) => void;
  setImageShowEqualPages: React.Dispatch<React.SetStateAction<boolean>>;
}

const ImageOutputContainer: React.FC<ImageOutputContainerProps> = ({
  imageDiffData,
  outputImageType,
  imageState,
  imageShowEqualPages,
  outputImageTypes,
  imageEventHandler,
  handleOutputImageTypeChange,
  setImageShowEqualPages,
}) => {
  const isPro = useAppSelector(isProUser);
  const { openDesktopModal } = useDesktopModal();
  const [exportProgress, setExportProgress] = React.useState<ExportProgress>({
    state: ExportProgressState.NotExporting,
    message: null,
  });

  const onExport = async (
    ev: React.MouseEvent<HTMLButtonElement>,
    exportType: ExportType,
  ) => {
    ev.preventDefault();
    const feature =
      exportType === ExportType.PDF
        ? DiffFeature.EXPORT_DOCUMENT_IMAGE_DIFF_PDF
        : DiffFeature.EXPORT_DOCUMENT_IMAGE_DIFF_PNG;

    const { handleExport } = await import('./commands/image-export-functions');

    await handleExport(
      DiffInputType.PDF,
      exportType,
      feature,
      isPro,
      openDesktopModal,
      setExportProgress,
    );
  };

  if (!imageDiffData) {
    return <ImageLoading />;
  }

  return (
    <div className={sharedCss.container}>
      <PdfSidebar header={<Tab svg={PreferencesSvg} label="Tools" />}>
        <div className={css.sidebarContent}>
          <DiffOutputTypeSwitch
            outputTypes={outputImageTypes}
            onTypeChange={handleOutputImageTypeChange}
            currentlySelectedType={outputImageType}
            vertical
          />
          <PdfImageTools
            state={imageState}
            eventHandler={imageEventHandler}
            showEqual={imageShowEqualPages}
            setShowEqual={setImageShowEqualPages}
          />
          <div className={css.buttonContainer}>
            <DiffSettingsButton
              label={t('DiffEditorHeader.exportAsPdf')}
              iconSvg={DocumentSvg}
              onClick={(ev: React.MouseEvent<HTMLButtonElement>) =>
                onExport(ev, ExportType.PDF)
              }
            />
            <DiffSettingsButton
              label={
                imageDiffData.length === 1 ? 'Export as PNG' : 'Export as PNGs'
              }
              iconSvg={ImageSvg}
              onClick={(ev: React.MouseEvent<HTMLButtonElement>) =>
                onExport(ev, ExportType.PNG)
              }
            />
          </div>
        </div>
      </PdfSidebar>
      <div className={sharedCss.content}>
        {imageDiffData.length > 0 &&
          imageDiffData.every(
            (image) => Math.round(image.mismatchPercentage * 100000) === 0,
          ) && (
            <MessageBanner
              type="info"
              title="The two files are visually identical"
              message="There is no image difference to show between these two files"
            />
          )}
        {exportProgress.state === ExportProgressState.ExportFailed && (
          <ExportErrorMessageBanner title="Error exporting diff" />
        )}
        <div className={cx(sharedCss.output, sharedCss.grey, css.imageDiff)}>
          {imageDiffData.map((imageData, index) => (
            <PdfDiffOutputImage
              key={imageData.resultKey}
              imageData={imageData}
              pageNumber={index + 1}
              imageType={outputImageType}
              imageEventHandler={imageEventHandler}
              imageState={imageState}
              showEqualPages={imageShowEqualPages}
            />
          ))}
        </div>
      </div>
      <Modal
        noCloseButton
        isOpen={exportProgress.state === ExportProgressState.Exporting}
        minWidth="0"
      >
        <div className={css.exportLoad}>
          <LoadingCircle size="small" />
          <div>
            <div>{exportProgress.message}</div>
            <div className={css.exportDesc}>
              Large documents or complex diffs may take longer.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ImageOutputContainer;
