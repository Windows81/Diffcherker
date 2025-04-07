class MessageError extends Error {
  readonly title: string;
  readonly type: 'user' | 'app';

  constructor(options: {
    title: string;
    message: string;
    type: MessageError['type'];
  }) {
    super(options.message);
    this.title = options.title;
    this.type = options.type;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default MessageError;
