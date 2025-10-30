// frontend/src/utils/logToBackend.ts
export const logToBackend = async (level: 'log' | 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: Record<string, any>) => {
  if (typeof window === 'undefined') {
    // Don't try to log from the server-side during SSR
    return;
  }

  // Log to browser console as well
  const fullMessage = metadata ? `${message} ${JSON.stringify(metadata)}` : message;
  switch (level) {
    case 'error':
      console.error(message, metadata);
      break;
    case 'warn':
      console.warn(message, metadata);
      break;
    case 'info':
      console.info(message, metadata);
      break;
    case 'debug':
      console.debug(message, metadata);
      break;
    default:
      console.log(message, metadata);
  }

  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level, message, ...metadata }),
    });
  } catch (error) {
    console.error('Failed to send log to backend:', error);
  }
};
