import * as i18nextExpressMiddleware from 'i18next-http-middleware';
import i18n from '../../i18n';

export const i18nextMiddleware = i18nextExpressMiddleware.handle(i18n);