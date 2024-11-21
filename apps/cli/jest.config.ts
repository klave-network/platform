export default {
    displayName: 'cli',
    preset: '../../jest.preset.cjs',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest']
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/cli'
};
