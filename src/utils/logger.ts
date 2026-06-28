const BASE_URL = 'https://wfw.toamultitech.tech';

/**
 * Logs an error to the central backend server.
 * 
 * @param error Any error object or message
 * @param info Additional context information
 * @param level Error level (ERROR, WARNING, INFO)
 */
export const logToServer = async (error: any, info?: any, level: string = 'ERROR') => {
  try {
    let message = 'Unknown Error';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (error && error.message) {
      message = error.message;
    }

    const context = {
      ...info,
      stack: error instanceof Error ? error.stack : undefined,
      rawError: JSON.stringify(error),
    };

    // Use absolute URL or relative if client.ts base URL handles it
    // Using relative to let client.ts base URL handle the domain
    await fetch(`${BASE_URL}/log_error.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        level,
        context,
      }),
    });
    
    console.log('[RemoteLogger] Successfully sent log to server:', message);
  } catch (err) {
    // Fallback if the logger itself fails
    console.error('[RemoteLogger] Failed to send log to server:', err);
  }
};
