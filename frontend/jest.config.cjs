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
          "^\\./vite-env$": "<rootDir>/test/mocks/vite-env.ts",
  "\\.(css|less|scss|sass)$": "<rootDir>/test/styleMock.js",
  
},
}