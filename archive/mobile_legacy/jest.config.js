module.exports = {
    preset: 'react-native',
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-appwrite)/)'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__mocks__/setup.js'],
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testEnvironment: 'node',
};
