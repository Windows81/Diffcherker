class DefaultError extends Error {
  constructor() {
    super(
      [
        "We're sorry, we can't process this file.",
        'Please try another file.',
      ].join('\n'),
    );
    this.name = 'Error';
  }
}

class FileSizeError extends Error {
  constructor() {
    super(
      [
        'File size exceeds 10MB.',
        'Please use Diffchecker Desktop to handle this file.',
      ].join('\n'),
    );
    this.name = 'File Too Large Error';
  }
}

class TimeoutError extends Error {
  constructor() {
    super(
      [
        'Document processing timed out.',
        'This is usually because your file is too complex for us to handle within a reasonable time.',
        'Please use Diffchecker Desktop to handle this file.',
      ].join('\n'),
    );
    this.name = 'Timeout Error';
  }
}

class PasswordProtectedError extends Error {
  constructor() {
    super('Document is password protected.');
    this.name = 'Password Protected Error';
  }
}

module.exports = {
  DefaultError,
  FileSizeError,
  TimeoutError,
  PasswordProtectedError,
};
