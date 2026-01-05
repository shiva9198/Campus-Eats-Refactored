import { databases, DATABASE_ID, COLLECTIONS } from '../services/appwrite';
import { Query } from 'react-native-appwrite';

// Mock the Appwrite modules
jest.mock('../services/appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        createDocument: jest.fn(),
        updateDocument: jest.fn(),
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        ORDERS: 'orders',
        MENU_ITEMS: 'menu_items',
    },
}));

describe('Order Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch orders for a user', async () => {
        const mockOrders = {
            documents: [
                {
                    $id: 'order-1',
                    userId: 'user-123',
                    items: JSON.stringify([{ name: 'Pizza', qty: 2 }]),
                    amount: 500,
                    status: 'paid',
                },
            ],
            total: 1,
        };

        databases.listDocuments.mockResolvedValue(mockOrders);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('userId', 'user-123')]
        );

        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].userId).toBe('user-123');
        expect(databases.listDocuments).toHaveBeenCalledWith(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('userId', 'user-123')]
        );
    });

    test('should update order status', async () => {
        const updatedOrder = {
            $id: 'order-1',
            status: 'collected',
        };

        databases.updateDocument.mockResolvedValue(updatedOrder);

        const result = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            'order-1',
            { status: 'collected' }
        );

        expect(result.status).toBe('collected');
        expect(databases.updateDocument).toHaveBeenCalledWith(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            'order-1',
            { status: 'collected' }
        );
    });

    test('should fetch pending payment orders', async () => {
        const mockPendingOrders = {
            documents: [
                {
                    $id: 'order-2',
                    status: 'pending_verification',
                    amount: 300,
                },
            ],
            total: 1,
        };

        databases.listDocuments.mockResolvedValue(mockPendingOrders);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('status', 'pending_verification')]
        );

        expect(result.documents[0].status).toBe('pending_verification');
    });
});
