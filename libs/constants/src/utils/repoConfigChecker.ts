import { ZodError, z } from 'zod';

const repoConfigSchemaV0 = z.object({
    version: z.string().or(z.number()).optional(),
    branch: z.string().optional(),
    applications: z.array(z.object(
        {
            name: z.string(),
            description: z.string().optional(),
            version: z.string().optional(),
            index: z.string().optional(),
            rootDir: z.string()
        }
    )).optional()
});

const repoConfigSchemaV1 = z.object({
    schema: z.string().or(z.number()).optional(),
    branches: z.array(z.string()).optional(),
    applications: z.array(z.object(
        {
            slug: z.string(),
            description: z.string().optional(),
            version: z.string().optional(),
            index: z.string().optional(),
            rootDir: z.string()
        }
    )).optional()
});

export const repoConfigSchemaLatest = repoConfigSchemaV1;
export type RepoConfigSchemaLatest = z.infer<typeof repoConfigSchemaLatest>;

export const getFinalParseConfig = (config: string | object | null): ReturnType<typeof repoConfigSchemaLatest.safeParse> & { chainError?: ZodError } => {
    const objectParse = typeof config === 'string' ? JSON.parse(config ?? '{}') : config ?? {};
    let originalParse = repoConfigSchemaV1.safeParse(objectParse);
    if (!originalParse.success) {
        const newParse = repoConfigSchemaV0.safeParse(objectParse);
        originalParse = {
            ...newParse,
            data: newParse.success ? {
                ...newParse.data,
                branches: newParse.data.branch ? [newParse.data.branch] : undefined,
                applications: newParse.data.applications?.map((app) => {
                    const newApp: NonNullable<RepoConfigSchemaLatest['applications']>[number] = {
                        ...app,
                        slug: app.name.replaceAll(/\W/g, '-').toLocaleLowerCase()
                    };
                    return newApp;
                })
            } : undefined,
            chainError: originalParse.error
        } as unknown as ReturnType<typeof repoConfigSchemaLatest.safeParse>;
    } else {
        originalParse.data.applications = originalParse.data.applications?.map((app) => {
            app.slug = app.slug.replaceAll(/\W/g, '-').toLocaleLowerCase();
            return app;
        });
    }
    return originalParse;
};