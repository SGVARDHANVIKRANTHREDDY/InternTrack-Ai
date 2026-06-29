export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogMetadata {
  requestId?: string;
  userId?: string;
  error?: any;
  [key: string]: any;
}

class StructuredLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    
    // Structure the log payload
    const logPayload = {
      timestamp,
      level,
      message,
      ...(metadata?.requestId && { requestId: metadata.requestId }),
      ...(metadata?.userId && { userId: metadata.userId }),
      ...metadata,
    };

    // Format error stack traces if present
    if (metadata?.error instanceof Error) {
      logPayload.error = {
        message: metadata.error.message,
        stack: metadata.error.stack,
        name: metadata.error.name,
      };
    }

    if (this.isProduction) {
      // In production, write as single-line JSON for log aggregators
      console.log(JSON.stringify(logPayload));
    } else {
      // In development, pretty-print for local terminal readability
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      const reqIdStr = metadata?.requestId ? ` [Req: ${metadata.requestId.substring(0, 8)}]` : '';
      const userStr = metadata?.userId ? ` [User: ${metadata.userId.substring(0, 8)}]` : '';
      
      console.log(
        `[${timestamp}] ${color}${level}${reset}${reqIdStr}${userStr}: ${message}`
      );
      
      if (metadata?.error) {
        console.error(metadata.error);
      }
    }
  }

  info(message: string, metadata?: LogMetadata) {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log('WARN', message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    this.log('ERROR', message, metadata);
  }
}

export const logger = new StructuredLogger();
