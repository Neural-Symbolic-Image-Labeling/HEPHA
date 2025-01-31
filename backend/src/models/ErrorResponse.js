class ErrorResponse {
  constructor(code, msg, errorLog = "") {
      this.code = code;
      this.msg = msg;
      this.errorLog = errorLog.toString() || errorLog;
  }
}

module.exports = { ErrorResponse };