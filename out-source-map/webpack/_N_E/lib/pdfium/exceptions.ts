export enum PDFiumExceptionType {
  UNKNOWN_MESSAGE = 'UnknownMessageException',
  UNKNOWN = 'UnknownException',
  MEMORY = 'MemoryException',
  INVALID_PDF = 'InvalidPDFException',
  PASSWORD = 'PasswordException',
  DESTROYED_WORKER = 'DestroyedWorkerException',
}

const hasName = (
  error: unknown,
): error is {
  name?: string;
  message?: string;
  stack?: string;
} => {
  return (
    error instanceof Error || (typeof error === 'object' && error !== null)
  );
};

export const handlePDFiumErrorResponse = (error: unknown) => {
  if (!hasName(error)) {
    return new Error('Invalid error response. ' + JSON.stringify(error)); // should never happen
  }

  switch (error.name) {
    case PDFiumExceptionType.UNKNOWN_MESSAGE:
      return new UnknownMessageException(error.message, error.stack);
    case PDFiumExceptionType.MEMORY:
      return new MemoryException(error.message, error.stack);
    case PDFiumExceptionType.INVALID_PDF:
      return new InvalidPDFException(error.message, error.stack);
    case PDFiumExceptionType.PASSWORD:
      return new PasswordException(error.message, error.stack);
    case PDFiumExceptionType.DESTROYED_WORKER:
      return new DestroyedWorkerException(error.message, error.stack);
    default:
      return new UnknownException(error.message, error.stack);
  }
};

class BaseException extends Error {
  constructor(name: string, message?: string, stack?: string) {
    super(message);
    // figure this out properly
    this.name = name;
    this.stack = stack;
  }
}

export class UnknownMessageException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.UNKNOWN_MESSAGE, msg, stack);
  }
}

export class UnknownException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.UNKNOWN, msg, stack);
  }
}

export class MemoryException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.MEMORY, msg, stack);
  }
}

export class InvalidPDFException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.INVALID_PDF, msg, stack);
  }
}

export class PasswordException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.PASSWORD, msg, stack);
  }
}

export class DestroyedWorkerException extends BaseException {
  constructor(msg?: string, stack?: string) {
    super(PDFiumExceptionType.DESTROYED_WORKER, msg, stack);
  }
}
