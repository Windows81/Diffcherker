import { PDFiumChunk } from 'lib/pdfium/messages';

export const getSvgRectDimensions = (
  y: [top: number, bottom: number],
  x: [left: number, right: number],
  pageHeight: number,
) => {
  const [left, right] = x;
  const top = pageHeight - y[0];
  const bottom = pageHeight - y[1];
  const width = Math.max(right - left, 0);
  const height = bottom - top;

  return { x: left, y: top, width, height };
};

interface PdfPageTextProps {
  chunks: PDFiumChunk[];
  pageHeight: number;
}

const PdfPageText: React.FC<PdfPageTextProps> = ({ chunks, pageHeight }) => {
  return (
    <>
      {chunks.map((chunk, i) =>
        chunk.text.map((line, j) => (
          <LineTspans
            key={`${i}-${j}`}
            line={line}
            y={chunk.y[j]}
            x={chunk.x[j]}
            fontSize={chunk.fontSize}
            pageHeight={pageHeight}
          />
        )),
      )}
    </>
  );
};

export default PdfPageText;

interface LineTspansProps {
  line: string;
  y: [top: number, bottom: number];
  x: [left: number, right: number][];
  fontSize: number;
  pageHeight: number;
}

export const LineTspans: React.FC<LineTspansProps> = ({
  line,
  y,
  x,
  fontSize,
  pageHeight,
}) => {
  const words: Word[] = [];

  let i = 0;
  while (i < line.length) {
    const nextSpaceIndex = line.indexOf(' ', i);
    if (nextSpaceIndex === i) {
      words.push({
        text: ' ',
        x: x[i],
      });
      i++;
    } else if (nextSpaceIndex > -1) {
      words.push({
        text: line.substring(i, nextSpaceIndex),
        x: [x[i][0], x[nextSpaceIndex - 1][1]],
      });
      i = nextSpaceIndex;
    } else {
      words.push({
        text: line.substring(i),
        x: [x[i][0], x[line.length - 1][1]],
      });
      i = line.length;
    }
  }

  return (
    <>
      {words.map(({ text, x }, i) => (
        <Tspan
          text={text}
          y={y}
          x={x}
          key={i}
          pageHeight={pageHeight}
          fontSize={fontSize}
        />
      ))}
    </>
  );
};

interface Word {
  text: string;
  x: [left: number, right: number];
}

interface TspanProps {
  text: string;
  y: [top: number, bottom: number];
  x: [left: number, right: number];
  fontSize?: number;
  pageHeight: number;
}

const Tspan: React.FC<TspanProps> = ({ text, y, x, fontSize, pageHeight }) => {
  const {
    x: left,
    y: top,
    width,
    height,
  } = getSvgRectDimensions(y, x, pageHeight);

  return (
    <tspan
      style={{ fontSize: fontSize || height }}
      x={left}
      y={top + height * 0.75} // y is the baseline for text and we're using 25% as an approximation for the descent height
      textLength={width}
      height={height}
      lengthAdjust="spacingAndGlyphs"
    >
      {text}
    </tspan>
  );
};
