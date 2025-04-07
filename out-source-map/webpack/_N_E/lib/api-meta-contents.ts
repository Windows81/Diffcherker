import createApiUrl from 'lib/create-api-url';

export interface ApiMetaContent {
  title: string;
  usage: string;
  params:
    | string
    | Array<{
        name: string;
        type: string;
        in: string;
        required: boolean;
        description: string;
      }>;
  example: string;
  responses: Array<{
    title: string;
    content: Record<string, unknown> | string;
  }>;
}

const textEndpoint = createApiUrl('/public/text');
const imageEndpoint = createApiUrl('/public/image');
const pdfEndpoint = createApiUrl('/public/pdf');

export const textApiContent: ApiMetaContent = {
  title: 'Text Diff',
  usage: `POST ${textEndpoint}`,
  params: [
    {
      name: 'output_type',
      type: 'string',
      in: 'query',
      required: true,
      description:
        "Specifies the type of output you receive in the response body. Value must be one of 'json', 'html', or 'html_json'.\n- json: (Content-Type: application/json)\nRow metadata generated from diff computation\n- html: (Content-Type: text/html)\nSame html/css you see on Diffchecker site\n- html_json: (Content-Type: application/json)\nSame html/css you see on Diffchecker site, but split up and embedded in JSON",
    },
    {
      name: 'diff_level',
      type: 'string',
      in: 'query',
      required: false,
      description:
        "Specifies whether you want to diff by word or character. Value must be one of 'word' or 'character'. Default is 'word'.",
    },
    {
      name: 'left',
      type: 'string',
      in: 'body',
      required: true,
      description: 'Left text you want to diff.',
    },
    {
      name: 'right',
      type: 'string',
      in: 'body',
      required: true,
      description: 'Right text you want to diff.',
    },
  ],
  example: `curl --location --request POST '${textEndpoint}?output_type=html&diff_level=word&email=YOUR_EMAIL' \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "left": "roses are red\\nviolets are blue",
    "right": "roses are green\\nviolets are purple"
    }'`,
  responses: [
    {
      title: 'output_type=json',
      content: {
        rows: [
          {
            end: false,
            left: {
              chunks: [
                {
                  value: 'roses are ',
                  type: 'equal',
                },
                {
                  value: 'red',
                  type: 'remove',
                },
              ],
              line: 1,
            },
            right: {
              chunks: [
                {
                  value: 'roses are ',
                  type: 'equal',
                },
                {
                  value: 'green',
                  type: 'insert',
                },
              ],
              line: 1,
            },
            insideChanged: true,
            start: true,
          },
          {
            end: true,
            left: {
              chunks: [
                {
                  value: '',
                  type: 'remove',
                },
                {
                  value: 'violets are ',
                  type: 'equal',
                },
                {
                  value: 'blue',
                  type: 'remove',
                },
              ],
              line: 2,
            },
            right: {
              chunks: [
                {
                  value: '',
                  type: 'insert',
                },
                {
                  value: 'violets are ',
                  type: 'equal',
                },
                {
                  value: 'purple',
                  type: 'insert',
                },
              ],
              line: 2,
            },
            insideChanged: true,
          },
        ],
        added: 3,
        removed: 3,
      },
    },
    {
      title: 'output_type=html_json',
      content: {
        html: '<table class="diff-table"><thead><tr><td class="line-number-header"></td><td class="side-content-header"></td><td class="line-number-header"></td><td class="side-content-header"></td></tr></thead><tbody><tr class="diff-row"><td data-content="1" class="diff-line-number"></td><td class="diff-line start diff-line-modified diff-line-with-removes"><span class="diff-chunk diff-chunk-equal diff-chunk-modified">roses are </span><span class="diff-chunk diff-chunk-removed diff-chunk-modified">red</span></td><td data-content="1" class="diff-line-number"></td><td class="diff-line start diff-line-modified diff-line-with-inserts"><span class="diff-chunk diff-chunk-equal diff-chunk-modified">roses are </span><span class="diff-chunk diff-chunk-inserted diff-chunk-modified">green</span></td></tr><tr class="diff-row"><td data-content="2" class="diff-line-number"></td><td class="diff-line end diff-line-modified diff-line-with-removes"><span class="diff-chunk diff-chunk-removed diff-chunk-modified"></span><span class="diff-chunk diff-chunk-equal diff-chunk-modified">violets are </span><span class="diff-chunk diff-chunk-removed diff-chunk-modified">blue</span></td><td data-content="2" class="diff-line-number"></td><td class="diff-line end diff-line-modified diff-line-with-inserts"><span class="diff-chunk diff-chunk-inserted diff-chunk-modified"></span><span class="diff-chunk diff-chunk-equal diff-chunk-modified">violets are </span><span class="diff-chunk diff-chunk-inserted diff-chunk-modified">purple</span></td></tr></tbody></table>',
        css: '\n.diff-table {\n  font-family: monospace;\n  background: #FFFFFF;\n  font-size: 0.8125rem;\n  border-collapse: collapse;\n}\n.side-content-header {\n  width: 50%;\n}\n.diff-row {\n}\n.diff-line-number {\n  color: #999;\n  padding: 0 8px 0 5px;\n  text-align: right;\n  vertical-align: top;\n}\n.diff-line-number:before {\n  content: attr(data-content);\n}\n.diff-line {\n  white-space: pre-wrap;\n  word-break: break-all;\n  overflow-wrap: break-word;\n  line-height: 1rem;\n  padding-right: 20px;\n}\n.diff-line-inserted {\n  background: #B5EFDB;\n}\n.diff-line-removed {\n  background: #FFC4C1;\n}\n.diff-line-empty {\n  background: #EAEEF0;\n}\n.diff-line-modified.diff-line-with-inserts {\n  background: #B5EFDB;\n}\n.diff-line-modified.diff-line-with-removes {\n  background: #FFC4C1;\n}\n.diff-chunk-inserted {\n  background: #6BDFB8;\n}\n.diff-chunk-removed {\n  background: #FF8983;\n}\n',
      },
    },
  ],
};

export const documentApiContent: ApiMetaContent = {
  title: 'Document Diff',
  usage: `POST ${pdfEndpoint}`,
  params: [
    {
      name: 'input_type',
      type: 'string',
      in: 'query',
      required: false,
      description:
        "Specifies the request content-type. Value must be one of 'json' or 'form'. Default is 'form'.\n- json: application/json\n- form: multipart/form-data",
    },
    {
      name: 'output_type',
      type: 'string',
      in: 'query',
      required: true,
      description:
        "Specifies the type of output you receive in the response body. Value must be one of 'json', 'html', or 'html_json'.\n- json: (Content-Type: application/json)\nRow metadata generated from PDF-text diff computation\n- html: (Content-Type: text/html)\nSame html/css you see on Diffchecker site for PDF-text diffs\n- html_json: (Content-Type: application/json)\nSame html/css you see on Diffchecker site for PDF-text diffs, but split up and embedded in JSON",
    },
    {
      name: 'diff_level',
      type: 'string',
      in: 'query',
      required: false,
      description:
        "Specifies whether you want to diff by word or character. Value must be one of 'word' or 'character'. Default is 'word'. Should only be used with PDF-text diff related output types.",
    },
    {
      name: 'left_pdf',
      type: 'file or string',
      in: 'body',
      required: true,
      description:
        'If input_type=json:\nstring containing data url of left pdf you want to diff\nIf input_type=form:\nLeft pdf file you want to diff. File extension must be .pdf',
    },
    {
      name: 'right_pdf',
      type: 'file or string',
      in: 'body',
      required: true,
      description:
        'If input_type=json:\nstring containing data url of right pdf you want to diff\nIf input_type=form:\nRight pdf file you want to diff. File extension must be .pdf',
    },
  ],
  example: `curl --location --request POST '${pdfEndpoint}?output_type=json&email=YOUR_EMAIL' \\
  --form 'left_pdf=@"/Users/user_name/Documents/example-1.pdf"' \\
  --form 'right_pdf=@"/Users/user_name/Documents/example-2.pdf"'`,
  responses: [
    {
      title: 'output_type=json',
      content: 'Same structure as Text diff response with output_type=json',
    },
    {
      title: 'output_type=html_json',
      content:
        'Same structure as Text diff response with output_type=html_json',
    },
  ],
};

export const imageApiContent: ApiMetaContent = {
  title: 'Image Diff',
  usage: `POST ${imageEndpoint}`,
  params: [
    {
      name: 'input_type',
      type: 'string',
      in: 'query',
      required: true,
      description:
        "Specifies the request content-type. Value must be one of 'json' or 'form'.\n- json: application/json\n- form: multipart/form-data",
    },
    {
      name: 'output_type',
      type: 'string',
      in: 'query',
      required: true,
      description:
        "Specifies the type of output you receive in the response body. Value must be one of 'json' or 'png'.\n- json: (Content-Type: application/json)\nSame PNG you see on Diffchecker site for image diffs, but embedded in JSON as a data url\n- png: (Content-Type: image/png)\nSame PNG you see on Diffchecker site for image diffs",
    },
    {
      name: 'left_image',
      type: 'file or string',
      in: 'body',
      required: true,
      description:
        'If input_type=json:\nstring containing data url of left image you want to diff (link)\nIf input_type=form:\nfile of left image you want to diff. Accepted file extensions include .png, .jpg, .jpeg',
    },
    {
      name: 'right_image',
      type: 'file or string',
      in: 'body',
      required: true,
      description:
        'If input_type=json:\nstring containing data url of right image you want to diff (link)\nIf input_type=form:\nfile of right image you want to diff. Accepted file extensions include .png, .jpg, .jpeg',
    },
  ],
  example: `Form Input:
  curl --location --request POST '${imageEndpoint}?input_type=form&output_type=png&email=YOUR_EMAIL' \\
  --form 'left_image=@"/Users/user_name/Documents/example-1.png"' \\
  --form 'right_image=@"/Users/user_name/Documentsr/example-2.png"'
  
  JSON Input:
  curl --location --request POST '${imageEndpoint}?input_type=json&output_type=png&email=YOUR_EMAIL' \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "left_image": <left image data url>,
    "right_image": <right image data url>,
    }'
    `,
  responses: [
    {
      title: 'output_type=json',
      content: {
        dataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABVAAAAS8CAYAAABqj6EFAAAABmJLR0QA/wD/AP...',
      },
    },
  ],
};
