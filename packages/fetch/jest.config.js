const config = {
    collectCoverageFrom: [
        '<rootDir>/**/src/*.ts',
        '!<rootDir>/**/src/**/types.ts'
    ],
    moduleFileExtensions: ['ts', 'js'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/node_modules/', '/lib/'],
    testRegex: '.*\\.(test|e2e)\\.ts?$',
    // testMatch: ['**/**/task.test.ts'],
    testURL: 'http://localhost',
    transform: {
        '\\.ts?$': 'ts-jest'
    },
    transformIgnorePatterns: ['/lib/', '/node_modules/'],
    setupFiles: ['<rootDir>/tests/setup.js'],
    verbose: true,
    preset: 'ts-jest',
    globals: {
        "ts-jest": {
            "tsconfig": "<rootDir>/tsconfig.test.json",
        }
    },
};

module.exports = config;
