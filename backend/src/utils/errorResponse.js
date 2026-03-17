class ErrorResponse extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ErrorResponse(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorResponse(message, 401);
  }

  static notFound(message = 'Resource not found') {
    return new ErrorResponse(message, 404);
  }

  static serverError(message = 'Server Error') {
    return new ErrorResponse(message, 500);
  }
}

module.exports = ErrorResponse;