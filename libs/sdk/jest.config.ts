export default {
    displayName: 'sdk',
    preset: '../../jest.preset.cjs',
    transform: {
        '^.+\\.[tj]s$': 'esbuild-jest-transform'
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/libs/sdk'
};
