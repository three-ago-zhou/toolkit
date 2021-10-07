const config = {
    collectCoverageFrom: [
        '<rootDir>/**/src/*.{ts,tsx}',
        '!<rootDir>/**/src/**/types.ts'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    testRegex: '.*\\.(test|e2e)\\.tsx?$',
    // testMatch: ['**/core/**/handleAction.test.ts'],
    testURL: 'http://localhost',
    transform: {
        '\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: ['/dist/', '/node_modules/'],
    verbose: true,
    preset: 'ts-jest',
    globals: {
        "ts-jest": {
            "tsconfig": "<rootDir>/tsconfig.json",
        }
    },
};

module.exports = config;
