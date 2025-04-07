import { codePointToValidArrayIndex, createDiff } from './googlediff';
import { DiffOperation, DmpDiff } from './types';

const enum Dir {
  DIAGONAL,
  HORIZONTAL,
  VERTICAL,
}

const createMatrix = <T>(rows: number, cols: number): T[][] => {
  return Array.from({ length: rows }, () => Array(cols));
};

export const generateDynamicProgrammingPath = (
  xStr: string,
  yStr: string,
  equalityScore?: (offset1: number, offset2: number) => number,
) => {
  const scores = createMatrix<number>(xStr.length, yStr.length);
  const directions = createMatrix<number>(xStr.length, yStr.length);
  const diagonalLengths = createMatrix<number>(xStr.length, yStr.length);

  for (let x = 0; x < xStr.length; x++) {
    for (let y = 0; y < yStr.length; y++) {
      const scoreFromLeft = x === 0 ? 0 : scores[x - 1][y];
      const scoreFromTop = y === 0 ? 0 : scores[x][y - 1];

      let scoreFromDiagonal = -1;
      if (xStr[x] === yStr[y]) {
        scoreFromDiagonal = x === 0 || y === 0 ? 0 : scores[x - 1][y - 1];
        if (x > 0 && y > 0 && directions[x - 1][y - 1] === Dir.DIAGONAL) {
          scoreFromDiagonal += diagonalLengths[x - 1][y - 1];
        }
        scoreFromDiagonal += equalityScore?.(x, y) ?? 1;
      }

      const score = Math.max(scoreFromLeft, scoreFromTop, scoreFromDiagonal);

      if (score === scoreFromDiagonal) {
        const prevDiagonalLength =
          x > 0 && y > 0 ? diagonalLengths[x - 1][y - 1] : 0;
        diagonalLengths[x][y] = prevDiagonalLength + 1;
        directions[x][y] = Dir.DIAGONAL;
      } else if (score === scoreFromTop) {
        diagonalLengths[x][y] = 0;
        directions[x][y] = Dir.VERTICAL;
      } else {
        diagonalLengths[x][y] = 0;
        directions[x][y] = Dir.HORIZONTAL;
      }

      scores[x][y] = score;
    }
  }

  return { scores, directions, diagonalLengths };
};

export const traceDynamicProgrammingPath = (
  xStr: string,
  yStr: string,
  directions: Dir[][],
): DmpDiff[] => {
  let x = xStr.length - 1;
  let y = yStr.length - 1;

  if (x < 0 && y < 0) {
    return [];
  } else if (x < 0) {
    return [createDiff(DiffOperation.INSERT, yStr)];
  } else if (y < 0) {
    return [createDiff(DiffOperation.DELETE, xStr)];
  }

  const path: DmpDiff[] = [];
  const lastPosInDir = { x, y };

  const handlePathChangeAt = (x: number, y: number) => {
    const dir =
      lastPosInDir.x < 0
        ? Dir.VERTICAL
        : lastPosInDir.y < 0
          ? Dir.HORIZONTAL
          : directions[lastPosInDir.x][lastPosInDir.y];
    if (dir === Dir.DIAGONAL) {
      path.push(
        createDiff(DiffOperation.EQUAL, xStr.slice(x + 1, lastPosInDir.x + 1)),
      );
    } else if (dir === Dir.VERTICAL) {
      path.push(
        createDiff(DiffOperation.INSERT, yStr.slice(y + 1, lastPosInDir.y + 1)),
      );
    } else {
      path.push(
        createDiff(DiffOperation.DELETE, xStr.slice(x + 1, lastPosInDir.x + 1)),
      );
    }
    lastPosInDir.x = x;
    lastPosInDir.y = y;
  };

  while (x >= 0 && y >= 0) {
    if (directions[x][y] !== directions[lastPosInDir.x][lastPosInDir.y]) {
      handlePathChangeAt(x, y);
    }

    if (directions[x][y] === Dir.DIAGONAL) {
      x--;
      y--;
    } else if (directions[x][y] === Dir.VERTICAL) {
      y--;
    } else {
      x--;
    }
  }

  handlePathChangeAt(x, y);
  if (x >= 0 || y >= 0) {
    handlePathChangeAt(-1, -1);
  }

  return path.reverse();
};

const diffDynamicProgramming = (
  str1: string,
  str2: string,
  equalityScore?: (offset1: number, offset2: number) => number,
): DmpDiff[] => {
  const { directions } = generateDynamicProgrammingPath(
    str1,
    str2,
    equalityScore,
  );
  return traceDynamicProgrammingPath(str1, str2, directions);
};

export const createEqualityScoreFnFromLineArray = ({
  chars1,
  chars2,
  lineArray,
}: {
  chars1: string;
  chars2: string;
  lineArray: string[];
}) => {
  return (offset1: number, offset2: number) => {
    const codePoint1 = chars1.codePointAt(offset1)!;
    const codePoint2 = chars2.codePointAt(offset2)!;

    if (codePoint1 === codePoint2) {
      const length = lineArray[codePointToValidArrayIndex(codePoint1)].length;
      return length === 0 ? 0.1 : 1 + Math.log(1 + length);
    }

    return 0.99;
  };
};

export default diffDynamicProgramming;
