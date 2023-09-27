const { utils: { getProjects } } = require('@commitlint/config-nx-scopes');

module.exports = {
    extends: [
        '@commitlint/config-conventional',
        '@commitlint/config-nx-scopes'
    ],
    rules: {
        'scope-enum': async (ctx) => {
            const projectFilter = ({ name }) =>
                !name.includes('e2e');
            const projectNames = new Set();
            (await getProjects(ctx, projectFilter))
                .forEach(element => {
                    projectNames.add(element);
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
