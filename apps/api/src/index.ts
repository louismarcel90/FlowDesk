import {createLogger} from '@flowdesk/logger';
import { getNodeEnv } from '@flowdesk/config';

const env =  getNodeEnv();
const logger = createLogger({
    name: 'api',
    level: env === 'production' ? 'info' : 'debug',
});
logger.info('Starting API...');
