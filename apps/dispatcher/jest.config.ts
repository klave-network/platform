export default {
    displayName: 'dispatcher',
    preset: '../../jest.preset.cjs',
    globals: {},
    testEnvironment: 'node',
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)', // 👈 allow esbuild to handle uuid
    ],
    transform: {
        '^.+\\.[tj]s$': 'esbuild-jest-transform'
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/dispatcher'
};
