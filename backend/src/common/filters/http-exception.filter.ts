import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

// Intercepts and transforms all outgoing HTTP exceptions into a unified JSON schema to provide consistent error messaging to the frontend.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const resBody = exception.getResponse();

    // Standardized Error Response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message:
        typeof resBody === 'object' && 'message' in resBody
          ? resBody.message
          : exception.message,
      error:
        typeof resBody === 'object' && 'error' in resBody
          ? resBody['error']
          : 'Error',
    };

    response.status(status).json(errorResponse);
  }
}
