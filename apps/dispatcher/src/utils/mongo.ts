import { MongoClient, Collection } from 'mongodb';

type UsageRecord = {
    type: string;
    timestamp: string;
    data: JSON | unknown;
};

let client: MongoClient;
export let collection: Collection<UsageRecord>;
export const mongoOps = {
    initialize: async () => {
        try {
            console.info('Initializing MongoDB connection');
            const uri = process.env['KLAVE_DISPATCH_MONGODB_URL'];
            if (!uri)
                throw new Error('MongoDB URI is not provided');
            client = new MongoClient(uri);
            await client.connect();
            collection = client.db(client.options.dbName).collection<UsageRecord>('UsageRecord');
        } catch (e) {
            console.error(`Could not initialize Sentry: ${e}`);
        }
    }
};
