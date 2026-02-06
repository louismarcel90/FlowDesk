export type AppEnv = 'development' | 'test' | 'staging' | 'production';

export function getNodeEnv(): AppEnv {
  const v = (process.env.NODE_ENV ?? 'development') as AppEnv;
  return v;
}
