import { z } from 'zod';

export const repoConfigSchema = z.object({
    version: z.string().or(z.number()),
    name: z.string(),
    slug: z.string(),
    branch: z.string(),
    targetSdk: z.string(),
    applications: z.array(z.object(
        {
            name: z.string(),
            targetSdk: z.string(),
            root: z.string()
        }
    ))
}).deepPartial();
