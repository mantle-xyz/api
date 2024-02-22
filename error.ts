export class BaseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class ExternalAPICallError extends BaseError {
  apiName: string;
  constructor(apiName: string, message: string) {
    super('EXTERNAL_API_CALL_ERROR', message);
    this.apiName = apiName;
  }
}
