/* eslint-disable */
export default {
    displayName: 'create',
    preset: '../../jest.preset.cjs',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': 'esbuild-jest-transform'
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/create'
};
