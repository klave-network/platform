import AWS from '@aws-sdk/client-s3';
export { NoSuchBucket } from '@aws-sdk/client-s3';
export type { PutObjectOutput } from '@aws-sdk/client-s3';
export { Upload } from "@aws-sdk/lib-storage";
import { logger } from './logger';


let objectStoreReference: AWS.S3 | undefined;

export const objectStore = new Proxy<AWS.S3>({} as AWS.S3, {
    get: (__unusedTarget, prop, receiver) => {
        if (objectStoreReference)
            return Reflect.get(objectStoreReference, prop, receiver);
        if (prop === 'uninitialized')
            return true;
    }
});

export const objectStoreOps = {
    initialize: async () => {
        logger.info('Configuring Klave BHDUI ObjectStore...');
        objectStoreReference = new AWS.S3({
            endpoint: process.env['KLAVE_BHDUI_S3_ENDPOINT'],
            region: process.env['KLAVE_BHDUI_S3_REGION'],
            credentials: {
                accessKeyId: process.env['KLAVE_BHDUI_S3_ACCESS_KEY'] ?? '',
                secretAccessKey: process.env['KLAVE_BHDUI_S3_SECRET'] ?? '',
            }
        });
    }
};