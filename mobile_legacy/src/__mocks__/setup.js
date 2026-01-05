// Polyfill for global
if (typeof global !== 'undefined') {
    global.window = global;
}

// Mock react-native-appwrite
jest.mock('react-native-appwrite', () => ({
    Client: jest.fn(() => ({
        setEndpoint: jest.fn().mockReturnThis(),
        setProject: jest.fn().mockReturnThis(),
    })),
    Account: jest.fn(),
    Databases: jest.fn(),
    Storage: jest.fn(),
    ID: {
        unique: jest.fn(() => 'mock-unique-id'),
    },
    Query: {
        equal: jest.fn((attr, value) => `Query.equal("${attr}", ${JSON.stringify(value)})`),
        notEqual: jest.fn((attr, value) => `Query.notEqual("${attr}", ${JSON.stringify(value)})`),
        limit: jest.fn((value) => `Query.limit(${value})`),
        orderDesc: jest.fn((attr) => `Query.orderDesc("${attr}")`),
    },
}));

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
    launchCameraAsync: jest.fn(),
    MediaTypeOptions: {
        Images: 'Images',
    },
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Suppress console warnings during tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    warn: jest.fn(),
    error: jest.fn(),
};
