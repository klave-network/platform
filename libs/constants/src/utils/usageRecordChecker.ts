import { ZodError, z } from 'zod';

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

const KreditConsumptionSchemaV1 = z.object({
    cluster_key: z.string(),
    node_key: z.string(),
    app_id: z.string(),
    fqdn: z.string(),
    wasm_hash: z.string(),
    request_id: z.string(),
    call_type: z.enum(['deploy', 'wasm']),
    is_transaction: z.boolean(),
    timestamp: z.number(),
    cpu_consumption: z.number(),
    native_calls_consumption: z.number(),
    ingress_in_bytes: z.number(),
    egress_in_bytes: z.number(),
    ledger_write_in_bytes: z.number(),
    ledger_read_in_bytes: z.number()
});

export const KreditConsumptionReportSchemaV0 = z.object({
    version: z.literal(0),
    consumption: KreditConsumptionSchemaV0,
    signature_b64: z.string()
});

export const KreditConsumptionReportSchemaV1 = z.object({
    version: z.literal(1),
    consumption: KreditConsumptionSchemaV1,
    signature_b64: z.string()
});

export const KreditConsumptionReportSchema = KreditConsumptionReportSchemaV0.or(KreditConsumptionReportSchemaV1);
export type ConsumptionReportSchemaLatest = z.infer<typeof KreditConsumptionReportSchemaV1>;

export const getFinalParseUsage = (usageRecord: string | object | null): ReturnType<typeof KreditConsumptionReportSchemaV1.safeParse> & { chainError?: ZodError } => {
    const objectParse = typeof usageRecord === 'string' ? JSON.parse(usageRecord ?? '{}') : usageRecord ?? {};
    const originalParse = KreditConsumptionReportSchema.safeParse(objectParse);
    if (originalParse.data?.version === 0) {
        const newData = originalParse.data as unknown as ConsumptionReportSchemaLatest;
        newData.version = 1;
        newData.consumption.call_type = 'wasm';
        newData.consumption.ingress_in_bytes = 0;
        newData.consumption.egress_in_bytes = 0;
        newData.consumption.ledger_write_in_bytes = 0;
        newData.consumption.ledger_read_in_bytes = 0;
        return newData as unknown as ReturnType<typeof KreditConsumptionReportSchemaV1.safeParse>;
    }
    return originalParse as unknown as ReturnType<typeof KreditConsumptionReportSchemaV1.safeParse>;
};