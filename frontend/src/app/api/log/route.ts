import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { level, message, ...metadata } = await request.json();

  // Log to the backend console
  switch (level) {
    case 'error':
      console.error(`[FRONTEND ERROR]: ${message}`, metadata);
      break;
    case 'warn':
      console.warn(`[FRONTEND WARN]: ${message}`, metadata);
      break;
    case 'info':
      console.info(`[FRONTEND INFO]: ${message}`, metadata);
      break;
    case 'debug':
      console.debug(`[FRONTEND DEBUG]: ${message}`, metadata);
      break;
    default:
      console.log(`[FRONTEND LOG]: ${message}`, metadata);
  }

  return NextResponse.json({ status: 'ok' });
}
