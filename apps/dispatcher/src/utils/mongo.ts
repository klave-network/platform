import { MongoClient, Collection } from 'mongodb';
import { z } from 'zod';

const KreditConsumptionSchema = z.object({
    cluster_key_b64: z.string(),
    app_id: z.string(),
    fqdn: z.string(),
    is_transaction: z.boolean(),
    timestamp: z.number(),
    cpu_consumption: z.number(),
    native_calls_consumption: z.number()
});

export const KreditConsumptionReportSchema = z.object({
    version: z.number(),
    consumption: KreditConsumptionSchema,
    signature_b64: z.string()
});

export type ConsumptionReport = z.infer<typeof KreditConsumptionReportSchema>;

type UsageRecord = {
    type: string;
    timestamp: string;
    data?: ConsumptionReport
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
