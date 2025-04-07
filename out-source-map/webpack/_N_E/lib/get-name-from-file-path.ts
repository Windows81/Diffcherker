import path from 'path';

const getNameFromFilePath = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const name = path.basename(normalizedPath);
  return name;
};

export default getNameFromFilePath;
