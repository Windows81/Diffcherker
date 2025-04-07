const stringToDocx = async (text: string): Promise<ArrayBuffer> => {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphArray = text.split('\n').map((line) => {
    return new Paragraph({
      children: [new TextRun(line)],
    });
  });
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphArray,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  if (!(buffer.buffer instanceof ArrayBuffer)) {
    throw new Error('Expected ArrayBuffer from docx');
  }

  return buffer.buffer;
};

export default stringToDocx;
