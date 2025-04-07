import { DiffInputType } from 'types/diff-input-type';
import { mimeTypesLocal } from './new/mime-types';

const mimeTypeToDiffType = (mimeType: string): DiffInputType | undefined => {
  const diffTypes = Object.keys(mimeTypesLocal) as DiffInputType[];
  for (const type of diffTypes) {
    if (mimeTypesLocal[type].some((regex) => regex.test(mimeType))) {
      return type;
    }
  }
  return undefined; // No matching diff type found
};

export default mimeTypeToDiffType;
