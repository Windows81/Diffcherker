export class AbortError extends Error {
  constructor() {
    super('Operation aborted');
    this.name = 'AbortError';
  }
}
