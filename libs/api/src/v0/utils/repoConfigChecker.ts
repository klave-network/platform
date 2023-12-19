import { ZodError, z } from 'zod';

export const repoConfigSchemaV0 = z.object({
    version: z.string().or(z.number()).optional(),
    branch: z.string().optional(),
    applications: z.array(z.object(
        {
            name: z.string(),
            description: z.string().optional(),
            version: z.string().optional(),
            rootDir: z.string()
        }
    )).optional()
});

export const repoConfigSchemaV1 = z.object({
    schema: z.string().or(z.number()).optional(),
    branches: z.array(z.string()).optional(),
    applications: z.array(z.object(
        {
            slug: z.string(),
            description: z.string().optional(),
            version: z.string().optional(),
            rootDir: z.string()
        }
    )).optional()
});

export const getFinalParseConfig = (config: string | object | null): ReturnType<typeof repoConfigSchemaV1.safeParse> & { chainError?: ZodError } => {
    const objectParse = typeof config === 'string' ? JSON.parse(config ?? '{}') : config ?? {};
    let originalParse = repoConfigSchemaV1.safeParse(objectParse);
    if (!originalParse.success) {
        const newParse = repoConfigSchemaV0.safeParse(objectParse);
        originalParse = {
            ...newParse,
            data: newParse.success ? {
                ...newParse.data,
                branches: newParse.data.branch ? [newParse.data.branch] : undefined,
                applications: newParse.data.applications?.map((app: any) => {
                    app.slug = (app.slug ?? app.name).replaceAll(/\W/g, '-').toLocaleLowerCase();
                    delete app.name;
                    return app;
                })
            } : undefined,
            chainError: originalParse.error
        } as any as ReturnType<typeof repoConfigSchemaV1.safeParse>;
    } else {
        originalParse.data.applications = originalParse.data.applications?.map((app: any) => {
            app.slug = app.slug.replaceAll(/\W/g, '-').toLocaleLowerCase();
            return app;
        });
    }
    return originalParse;
};