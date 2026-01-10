import { adminService } from '../adminService';
import { databases } from '../appwrite';

jest.mock('../appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        createDocument: jest.fn(),
        updateDocument: jest.fn(),
        deleteDocument: jest.fn()
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        ORDERS: 'orders',
        SETTINGS: 'settings',
        OFFERS: 'offers'
    },
    ID: { unique: () => 'unique-id' },
    Query: {
        equal: jest.fn((attr, value) => `Query.equal("${attr}", ${JSON.stringify(value)})`),
        limit: jest.fn((value) => `Query.limit(${value})`),
        orderDesc: jest.fn((attr) => `Query.orderDesc("${attr}")`)
    }
}));

describe('adminService High Coverage', () => {
    beforeEach(() => jest.clearAllMocks());

    // HAPPY PATHS
    test('getDashboardStats: calculates statistics correctly', async () => {
        // Mock pending payments
        databases.listDocuments.mockResolvedValueOnce({
            documents: [{ $id: '1' }, { $id: '2' }],
            total: 2
        });

        // Mock active orders
        databases.listDocuments.mockResolvedValueOnce({
            documents: [{ $id: '3' }],
            total: 1
        });

        // Mock completed orders with revenue
        databases.listDocuments.mockResolvedValueOnce({
            documents: [
                { $id: '4', amount: 100 },
                { $id: '5', amount: 250 }
            ],
            total: 2
        });

        const stats = await adminService.getDashboardStats();

        expect(stats.pendingPayments).toBe(2);
        expect(stats.activeOrders).toBe(1);
        expect(stats.totalRevenue).toBe(350);
        expect(stats.orderCount).toBe(2);
    });

    test('getGlobalSettings: returns settings document', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{
                $id: 'settings1',
                logoUrl: 'https://example.com/logo.png',
                upi_id: 'college@upi'
            }]
        });

        const result = await adminService.getGlobalSettings();
        expect(result.logoUrl).toBe('https://example.com/logo.png');
    });

    test('getGlobalSettings: returns null when no settings exist', async () => {
        databases.listDocuments.mockResolvedValue({ documents: [] });

        const result = await adminService.getGlobalSettings();
        expect(result).toBeNull();
    });

    test('updateGlobalSettings: updates existing settings', async () => {
        // Mock existing settings
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: 'settings1' }]
        });

        databases.updateDocument.mockResolvedValue({
            $id: 'settings1',
            logoUrl: 'https://new-logo.png'
        });

        const result = await adminService.updateGlobalSettings({
            logoUrl: 'https://new-logo.png'
        });

        expect(databases.updateDocument).toHaveBeenCalled();
        expect(result.logoUrl).toBe('https://new-logo.png');
    });

    test('updateGlobalSettings: creates new settings if none exist', async () => {
        // Mock no existing settings
        databases.listDocuments.mockResolvedValue({ documents: [] });

        databases.createDocument.mockResolvedValue({
            $id: 'settings1',
            logoUrl: 'https://logo.png'
        });

        const result = await adminService.updateGlobalSettings({
            logoUrl: 'https://logo.png'
        });

        expect(databases.createDocument).toHaveBeenCalled();
        expect(result.logoUrl).toBe('https://logo.png');
    });

    test('getOffers: fetches all promotional offers', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [
                { $id: '1', title: 'Offer 1' },
                { $id: '2', title: 'Offer 2' }
            ]
        });

        const result = await adminService.getOffers();
        expect(result.documents).toHaveLength(2);
    });

    test('createOffer: creates new promotional offer', async () => {
        databases.createDocument.mockResolvedValue({
            $id: 'offer1',
            title: 'New Offer'
        });

        const result = await adminService.createOffer({
            title: 'New Offer',
            subtitle: 'Great deal'
        });

        expect(result.title).toBe('New Offer');
    });

    test('deleteOffer: deletes promotional offer', async () => {
        databases.deleteDocument.mockResolvedValue({});

        await adminService.deleteOffer('offer1');

        expect(databases.deleteDocument).toHaveBeenCalledWith(
            'test-db',
            'offers',
            'offer1'
        );
    });

    test('setShopStatus: updates shop open/closed status', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: 'settings1' }]
        });

        databases.updateDocument.mockResolvedValue({
            $id: 'settings1',
            shopOpen: true
        });

        const result = await adminService.setShopStatus(true);
        expect(result.shopOpen).toBe(true);
    });

    // SAD PATHS (Error Handling)
    test('getDashboardStats: throws on database failure', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Database Error'));

        await expect(adminService.getDashboardStats()).rejects.toThrow('Database Error');
    });

    test('updateGlobalSettings: throws on permission denied', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: 'settings1' }]
        });
        databases.updateDocument.mockRejectedValue(new Error('Unauthorized'));

        await expect(
            adminService.updateGlobalSettings({ logoUrl: 'test.png' })
        ).rejects.toThrow('Unauthorized');
    });

    test('setShopStatus: throws on update failure', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ $id: 'settings1' }]
        });
        databases.updateDocument.mockRejectedValue(new Error('Update Failed'));

        await expect(adminService.setShopStatus(true)).rejects.toThrow('Update Failed');
    });

    test('deleteOffer: throws on permission denied', async () => {
        databases.deleteDocument.mockRejectedValue(new Error('Unauthorized'));

        await expect(adminService.deleteOffer('offer1')).rejects.toThrow('Unauthorized');
    });
});
