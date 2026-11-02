module.exports = {
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.[tj]sx?$': 'babel-jest'
    },

    setupFilesAfterEnv: [
        '<rootDir>/test/setup.ts'
    ],

    clearMocks: true,

    testMatch: [
        '**/?(*.)+(spec|test).[tj]s?(x)'
    ],
    moduleNameMapper: {
  "\\.(css|less|scss|sass)$": "<rootDir>/test/styleMock.js",
},
}