/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import { it, jest } from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const { jest } = require('@jest/globals');
  return {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  };
});

// Mock API client to prevent async failures
jest.mock('../src/api/client', () => {
  const { jest } = require('@jest/globals');
  return {
    fetchCampusBranding: jest.fn(() => Promise.resolve({
      logoUrl: '/static/logo.png',
      name: 'Test University'
    })),
  };
});

it('renders correctly', async () => {
  await act(async () => {
    renderer.create(<App />);
  });
});
