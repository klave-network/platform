export default {
    displayName: 'hubber',
    preset: '../../jest.preset.js',
    testEnvironment: '../../tools/fixtures/_mongoJestEnv.ts',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' }
        ]
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/hubber'
};
