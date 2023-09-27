import { z } from 'zod';

export const klaveRcConfigurationSchema = z.object({
    version: z.string(),
    branches: z.array(z.string()).optional(),
    rootDir: z.string().optional().optional(),
    applications: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        version: z.string().regex(/^[0-9]*?\.[0-9]*?\.[0-9]*?$/gm),
        index: z.string().optional(),
        branches: z.array(z.string()).optional(),
        rootDir: z.string().optional()
    }))
});

export type KlaveRcConfiguration = z.infer<typeof klaveRcConfigurationSchema>;