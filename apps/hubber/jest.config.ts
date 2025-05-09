export default {
    displayName: 'hubber',
    preset: '../../jest.preset.cjs',
    testEnvironment: '../../tools/fixtures/_mongoJestEnv.ts',
    transform: {
        '^.+\\.[tj]s$': 'esbuild-jest-transform'
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/hubber'
};
