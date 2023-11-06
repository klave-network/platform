import url from 'url';
import path from 'node:path';
import i18n from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

(async () => {
    await i18n
        .use(Backend)
        .use(i18nextMiddleware.LanguageDetector)
        .init({
            backend: {
                loadPath: path.join(__dirname, 'i18n/locales/{{lng}}/{{ns}}.json')
            },
            ns: ['errors'],
            defaultNS: 'errors',
            fallbackLng: 'en',
            preload: ['en']
        });

    return i18n;
})();

export default i18n;