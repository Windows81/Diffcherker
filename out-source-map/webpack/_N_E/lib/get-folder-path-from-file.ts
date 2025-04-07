import path from 'path';

const getFolderPathFromFile = (file: {
  path: string;
  webkitRelativePath: string;
}): string => {
  const filePath = file.path;
  const relativePath = file.webkitRelativePath;

  const relativeFirstSlash = relativePath.indexOf(path.sep);
  const numberOfCharsToRemove = relativePath.length - relativeFirstSlash;

  return filePath.substring(0, filePath.length - numberOfCharsToRemove);
};

export default getFolderPathFromFile;
