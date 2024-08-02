export default {
    displayName: 'hubber',
    preset: '../../jest.preset.cjs',
    testEnvironment: '../../tools/fixtures/_mongoJestEnv.ts',
    transform: {
        '^.+\\.[tj]s$': '@swc/jest'
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/hubber'
};
