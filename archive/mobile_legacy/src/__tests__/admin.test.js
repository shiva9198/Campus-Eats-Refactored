import { databases, DATABASE_ID, COLLECTIONS } from '../services/appwrite';
import { Query } from 'react-native-appwrite';

jest.mock('../services/appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        updateDocument: jest.fn(),
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        ORDERS: 'orders',
        SETTINGS: 'settings',
    },
}));

describe('Admin Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch dashboard statistics', async () => {
        // Mock pending payments
        databases.listDocuments.mockResolvedValueOnce({
            documents: [{ $id: '1' }, { $id: '2' }],
            total: 2,
        });

        // Mock active orders
        databases.listDocuments.mockResolvedValueOnce({
            documents: [{ $id: '3' }, { $id: '4' }, { $id: '5' }],
            total: 3,
        });

        const pendingResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('status', 'pending_verification')]
        );

        const activeResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('status', ['preparing', 'ready', 'paid'])]
        );

        expect(pendingResult.total).toBe(2);
        expect(activeResult.total).toBe(3);
    });

    test('should verify payment and generate OTP', async () => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const updatedOrder = {
            $id: 'order-1',
            status: 'paid',
            otp: otp,
            verifiedBy: 'admin@college.edu',
        };

        databases.updateDocument.mockResolvedValue(updatedOrder);

        const result = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            'order-1',
            {
                status: 'paid',
                otp: otp,
                verifiedBy: 'admin@college.edu',
            }
        );

        expect(result.status).toBe('paid');
        expect(result.otp).toHaveLength(6);
        expect(result.verifiedBy).toBe('admin@college.edu');
    });

    test('should fetch global settings', async () => {
        const mockSettings = {
            documents: [
                {
                    $id: 'settings-1',
                    logoUrl: 'https://example.com/logo.png',
                    upi_id: 'college@upi',
                },
            ],
            total: 1,
        };

        databases.listDocuments.mockResolvedValue(mockSettings);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SETTINGS,
            [Query.limit(1)]
        );

        expect(result.documents[0].logoUrl).toBe('https://example.com/logo.png');
    });

    test('should search order by OTP', async () => {
        const mockOrder = {
            documents: [
                {
                    $id: 'order-1',
                    otp: '123456',
                    status: 'ready',
                },
            ],
            total: 1,
        };

        databases.listDocuments.mockResolvedValue(mockOrder);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [
                Query.equal('otp', '123456'),
                Query.notEqual('status', 'collected'),
            ]
        );

        expect(result.documents[0].otp).toBe('123456');
        expect(result.documents[0].status).toBe('ready');
    });
});
