export function logInfo(message: string, meta?: Record<string, unknown>) {
  // placeholder: pino viendra à l'étape API (plus tard)
  console.log(JSON.stringify({ level: 'info', message, ...meta }));
}
