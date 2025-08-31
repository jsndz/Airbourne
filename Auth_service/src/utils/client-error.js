const AppError = require("./error-handler");
const { StatusCodes } = require("http-status-codes");

class clientError extends AppError {
  constructor(errorName, message, explanation, statusCode) {
    let errorName = error.name;
    let explanation = [];

    super(errorName, message, explanation, statusCode);
  }
}

module.exports = clientError;
