import { NextRequest, NextResponse } from 'next/server';

interface ErrorData {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  level: 'page' | 'component' | 'critical';
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorData = await request.json();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Client Error Logged:', {
        id: errorData.errorId,
        message: errorData.message,
        level: errorData.level,
        url: errorData.url,
        timestamp: errorData.timestamp,
      });
    }

    // In production, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry
      // Sentry.captureException(new Error(errorData.message), {
      //   tags: {
      //     errorId: errorData.errorId,
      //     level: errorData.level,
      //   },
      //   extra: errorData,
      // });

      // Example: Send to custom logging service
      // await fetch(process.env.ERROR_LOGGING_ENDPOINT!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData),
      // });
    }

    // Store in database for analysis (optional)
    // await db.errors.create({
    //   data: {
    //     errorId: errorData.errorId,
    //     message: errorData.message,
    //     stack: errorData.stack,
    //     level: errorData.level,
    //     url: errorData.url,
    //     userAgent: errorData.userAgent,
    //     timestamp: new Date(errorData.timestamp),
    //   },
    // });

    return NextResponse.json({ success: true, errorId: errorData.errorId });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
