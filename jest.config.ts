import type { Config } from 'jest';

const config: Config = {
  projects: [
    // Pure TypeScript library tests — run in Node, no React Native runtime needed
    {
      displayName: 'lib',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/lib/**/*.test.[jt]s?(x)'],
      transform: {
        '^.+\\.tsx?$': [
          'babel-jest',
          {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript',
            ],
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^expo-location$': '<rootDir>/__mocks__/expo-location.js',
        '^expo-task-manager$': '<rootDir>/__mocks__/expo-task-manager.js',
        '^\\.\\./supabase$': '<rootDir>/__mocks__/supabase.js',
        '^\\./supabase$': '<rootDir>/__mocks__/supabase.js',
      },
    },
    // React Native / Expo component tests — use jest-expo preset
    {
      displayName: 'react-native',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/__tests__/**/!(lib)/**/*.test.[jt]s?(x)',
        '<rootDir>/__tests__/*.test.[jt]s?(x)',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@rnmapbox)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
