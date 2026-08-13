export class ApiError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'กรุณาล็อกอินเพื่อเข้าใช้งานระบบ') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'การเชื่อมต่อหมดเวลาในการประมวลผล กรุณาลองใหม่อีกครั้ง') {
    super(message, 504, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}
