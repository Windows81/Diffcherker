import { DiffInputType } from 'types/diff-input-type';

export const mimeTypesLocal: Record<DiffInputType, RegExp[]> = {
  [DiffInputType.IMAGE]: [/image\//],
  [DiffInputType.PDF]: [
    /application\/pdf/,
    /application\/msword/,
    /application\/rtf/,
    /application\/vnd.oasis.opendocument.text/,
    /application\/vnd.openxmlformats-officedocument.wordprocessingml.document/,
    /application\/vnd.ms-powerpoint/,
    /application\/vnd.openxmlformats-officedocument.presentationml.presentation/,
  ],
  [DiffInputType.EXCEL]: [
    /application\/vnd.ms-excel/,
    /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/,
    /application\/vnd.oasis.opendocument.spreadsheet/,
    /text\/csv/,
  ],
  [DiffInputType.TEXT]: [
    /text\/plain/,
    /text\/html/,
    /text\/xml/,
    /application\/json/,
    /application\/xml/,
    /application\/vnd.ms-excel/,
    /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/,
    /application\/vnd.oasis.opendocument.spreadsheet/,
    /application\/pdf/,
    /application\/msword/,
    /application\/rtf/,
    /application\/vnd.oasis.opendocument.text/,
    /application\/vnd.openxmlformats-officedocument.wordprocessingml.document/,
  ],
  [DiffInputType.FOLDER]: [],
};
