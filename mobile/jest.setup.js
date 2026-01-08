
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock other native modules if needed
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
        defaults: { headers: { common: {} } },
    })),
    defaults: { headers: { common: {} } },
}));

// Comprehensive Manual Mock for React Native
jest.mock('react-native', () => {
    const React = require('react');
    const mockComponent = (name) => class extends React.Component {
        render() { return React.createElement(name, this.props, this.props.children); }
    };

    return {
        StyleSheet: {
            create: (styles) => styles,
            flatten: () => ({}),
        },
        Platform: { OS: 'ios', select: (obj) => obj.ios },
        useColorScheme: jest.fn(() => 'light'),
        Alert: { alert: jest.fn() },
        View: mockComponent('View'),
        Text: mockComponent('Text'),
        TouchableOpacity: mockComponent('TouchableOpacity'),
        SafeAreaView: mockComponent('SafeAreaView'),
        StatusBar: mockComponent('StatusBar'),
        ActivityIndicator: mockComponent('ActivityIndicator'),
        ScrollView: mockComponent('ScrollView'),
        TextInput: mockComponent('TextInput'),
        Image: mockComponent('Image'),
        FlatList: mockComponent('FlatList'),
        Switch: mockComponent('Switch'),
        RefreshControl: mockComponent('RefreshControl'),
        // Add more as needed
        KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
        Modal: mockComponent('Modal'),
        PermissionsAndroid: { request: jest.fn() },
    };
});

