import configNxScopes from '@commitlint/config-nx-scopes';

export default {
    extends: [
        '@commitlint/config-conventional',
        '@commitlint/config-nx-scopes'
    ],
    rules: {
        'scope-enum': async (ctx) => {
            const projectFilter = ({ name }) =>
                !name.includes('e2e');
            const projectNames = new Set();
            (await configNxScopes.utils.getProjects(ctx, projectFilter))
                .forEach(element => {
                    projectNames.add(element);
                });
            return [
                2,
                'always',
                [
                    ...projectNames
                ]
            ];
        },
        'subject-case': [
            2,
            'always',
            [
                'sentence-case'
            ]
        ]
    }
};
