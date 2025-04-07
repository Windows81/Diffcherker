import { captureException } from 'lib/sentry';
import Tracking, { EventProperties } from 'lib/tracking';
import { useCallback, useState } from 'react';
import { DiffInputType } from 'types/diff-input-type';
import { DiffSide } from 'types/diffSide';
import mimeTypeToDiffType from 'lib/mime-type-to-diff-type';
import InvalidUploadModal from '../invalid-upload-modal';
import DiffUploadButton from '../diff-upload/diff-upload-button';

export interface TextDiffUploadButtonProps {
  label: string;
  side: DiffSide;
  onChange: (arg: { file: File; data: string }) => void;
}

const TextDiffUploadButton: React.FC<
  React.PropsWithChildren<TextDiffUploadButtonProps>
> = ({ label, side, onChange, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferredDiffType, setPreferredDiffType] = useState(
    DiffInputType.TEXT,
  );

  const trackUploadEvent = useCallback(
    (type: 'success' | 'fail', eventProperties: EventProperties) => {
      Tracking.trackEvent(
        type === 'success'
          ? 'Uploaded file to diff'
          : 'Failed uploading file to diff',
        {
          diffInputType: DiffInputType.TEXT,
          uploadMethod: 'diff-input-header',
          side,
          ...eventProperties,
        },
      );
    },
    [side],
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          onChange({ file, data: reader.result });

          if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
            const { addRecentFile } = await import(
              'components/new/recent-diffs/commands/recent-diff-utils'
            );
            addRecentFile({
              filePath: file.path,
              diffType: DiffInputType.TEXT,
            });
          }
        } else {
          captureException(
            "DiffInputHeader file upload didn't return string result",
            {
              contexts: {
                'Diff input': { Type: DiffInputType.TEXT },
              },
            },
          );
        }
      };

      const preferredDiffType =
        mimeTypeToDiffType(file.type) ?? DiffInputType.TEXT;

      if (preferredDiffType === DiffInputType.TEXT) {
        trackUploadEvent('success', {
          mimeType: file.type,
        });

        reader.readAsText(file, 'UTF-8');
      } else {
        trackUploadEvent('fail', {
          mimeType: file.type,
          reason: `Prefer ${preferredDiffType} diff`,
          preferredDiffType,
        });
        setIsModalOpen(true);
      }

      setPreferredDiffType(preferredDiffType);
    },
    [onChange, trackUploadEvent],
  );

  return (
    <>
      <DiffUploadButton
        label={label}
        side={side}
        type={DiffInputType.TEXT}
        acceptedFileTypes={[]}
        handleFileUpload={handleFileUpload}
      >
        {children}
      </DiffUploadButton>
      <InvalidUploadModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        preferredDiffType={preferredDiffType}
        currentDiffType={DiffInputType.TEXT}
      />
    </>
  );
};

export default TextDiffUploadButton;
