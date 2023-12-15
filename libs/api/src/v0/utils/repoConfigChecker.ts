import { z } from 'zod';

export const repoConfigSchema = z.object({
    schema: z.string().or(z.number()).optional(),
    branches: z.array(z.string()).optional(),
    applications: z.array(z.object(
        {
            slug: z.string(),
            description: z.string().optional(),
            rootDir: z.string()
        }
    ))
});
