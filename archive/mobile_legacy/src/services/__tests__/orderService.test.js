import { orderService } from '../orderService';
import { databases } from '../appwrite';

jest.mock('../appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        updateDocument: jest.fn()
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: { ORDERS: 'orders' },
    Query: {
        equal: jest.fn((attr, value) => `Query.equal("${attr}", ${JSON.stringify(value)})`),
        notEqual: jest.fn((attr, value) => `Query.notEqual("${attr}", ${JSON.stringify(value)})`),
        orderDesc: jest.fn((attr) => `Query.orderDesc("${attr}")`)
    }
}));

describe('orderService High Coverage', () => {
    beforeEach(() => jest.clearAllMocks());

    // HAPPY PATHS
    test('searchOrderByOtp: returns order when OTP matches', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: 'order1', otp: '123456', status: 'ready' }]
        });

        const result = await orderService.searchOrderByOtp('123456');
        expect(result.$id).toBe('order1');
        expect(result.otp).toBe('123456');
    });

    test('searchOrderByOtp: returns null when no match found', async () => {
        databases.listDocuments.mockResolvedValue({ documents: [] });

        const result = await orderService.searchOrderByOtp('000000');
        expect(result).toBeNull();
    });

    test('updateStatus: successfully updates order status', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'order1',
            status: 'paid'
        });

        const result = await orderService.updateStatus('order1', 'paid');
        expect(result.status).toBe('paid');
    });

    test('updateStatus: includes metadata when provided', async () => {
        databases.updateDocument.mockResolvedValue({});

        await orderService.updateStatus('order1', 'paid', { verifiedBy: 'Admin' });

        expect(databases.updateDocument).toHaveBeenCalledWith(
            'test-db',
            'orders',
            'order1',
            expect.objectContaining({
                status: 'paid',
                verifiedBy: 'Admin'
            })
        );
    });

    test('getOrdersByStatus: fetches active orders correctly', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [
                { $id: '1', status: 'paid' },
                { $id: '2', status: 'preparing' }
            ]
        });

        const result = await orderService.getOrdersByStatus('active');
        expect(result.documents).toHaveLength(2);
    });

    test('getPendingPayments: fetches pending verification orders', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: '1', status: 'pending_verification' }]
        });

        const result = await orderService.getPendingPayments();
        expect(result.documents[0].status).toBe('pending_verification');
    });

    test('verifyPayment: generates OTP and updates order', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'order1',
            status: 'paid',
            otp: '123456'
        });

        const result = await orderService.verifyPayment('order1', 'admin@test.com');
        expect(result.status).toBe('paid');
        expect(result.otp).toBeDefined();
    });

    test('rejectPayment: updates order with rejection details', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'order1',
            status: 'rejected'
        });

        const result = await orderService.rejectPayment('order1', 'admin@test.com', 'Invalid screenshot');
        expect(result.status).toBe('rejected');
    });

    test('markAsCollected: updates order to collected status', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'order1',
            status: 'collected'
        });

        const result = await orderService.markAsCollected('order1');
        expect(result.status).toBe('collected');
    });

    // SAD PATHS (Error Handling)
    test('searchOrderByOtp: throws error on network failure', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Network Error'));

        await expect(orderService.searchOrderByOtp('123456')).rejects.toThrow('Network Error');
    });

    test('updateStatus: throws error on update failure', async () => {
        databases.updateDocument.mockRejectedValue(new Error('Update Failed'));

        await expect(orderService.updateStatus('order1', 'paid')).rejects.toThrow('Update Failed');
    });

    test('getOrdersByStatus: throws error on database failure', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Database Error'));

        await expect(orderService.getOrdersByStatus('active')).rejects.toThrow('Database Error');
    });

    test('verifyPayment: throws error on permission denied', async () => {
        databases.updateDocument.mockRejectedValue(new Error('Unauthorized'));

        await expect(orderService.verifyPayment('order1', 'admin@test.com')).rejects.toThrow('Unauthorized');
    });
});
