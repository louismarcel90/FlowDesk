import { logInfo } from '@flowdesk/logger';
import { getNodeEnv } from '@flowdesk/config';

logInfo('api started (placeholder)', { env: getNodeEnv() });
