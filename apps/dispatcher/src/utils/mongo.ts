import { MongoClient, Collection } from 'mongodb';
import { z } from 'zod';

const KreditConsumptionSchemaV0 = z.object({
    cluster_key: z.string(),
    node_key: z.string(),
    app_id: z.string(),
    fqdn: z.string(),
    wasm_hash: z.string(),
    request_id: z.string(),
    is_transaction: z.boolean(),
    timestamp: z.number(),
    cpu_consumption: z.number(),
    native_calls_consumption: z.number()
});

export const KreditConsumptionReportSchema = z.object({
    version: z.number(),
    consumption: KreditConsumptionSchemaV0,
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
export let collectionDev: Collection<UsageRecord>;
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

            const uriDev = process.env['KLAVE_DISPATCH_DEV_MONGODB_URL'];
            if (uriDev) {
                // Bifurcate data storage for dev and prod
                // TODO: This must be removed eventually
                const clientDev = new MongoClient(uriDev);
                await clientDev.connect();
                collectionDev = clientDev.db(clientDev.options.dbName).collection<UsageRecord>('UsageRecord');
                const originalCollection = collection;
                collection = new Proxy(originalCollection, {
                    get(target, prop, receiver) {
                        const member = Reflect.get(target, prop, receiver);
                        if (typeof member === 'function') {
                            return function (...args: unknown[]) {
                                const targetResult = member.apply(target, args);
                                try {
                                    const devMember = Reflect.get(collectionDev, prop, receiver);
                                    if (typeof devMember === 'function') {
                                        devMember.apply(collectionDev, args);
                                    }
                                } catch (__unusedError) {
                                    // Swallow silently the error on the mirror collection
                                }
                                return targetResult;
                            };
                        }
                        return member;
                    }
                });
            }

        } catch (error) {
            console.error(`Could not initialize Sentry: ${error}`);
        }
    }
};
