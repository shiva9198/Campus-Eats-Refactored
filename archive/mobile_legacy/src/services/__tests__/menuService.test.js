import { menuService } from '../menuService';
import { databases, storage } from '../appwrite';

jest.mock('../appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        createDocument: jest.fn(),
        updateDocument: jest.fn()
    },
    storage: {
        createFile: jest.fn(),
        getFileView: jest.fn()
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: { MENU_ITEMS: 'menu_items' },
    BUCKET_ID: 'test-bucket',
    ID: { unique: () => 'unique-id' },
    Query: {
        limit: jest.fn((value) => `Query.limit(${value})`),
        equal: jest.fn((attr, value) => `Query.equal("${attr}", ${JSON.stringify(value)})`)
    }
}));

describe('menuService High Coverage', () => {
    beforeEach(() => jest.clearAllMocks());

    // HAPPY PATHS
    test('getMenuItems: fetches all menu items', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [
                { $id: '1', name: 'Burger', price: 150 },
                { $id: '2', name: 'Pizza', price: 300 }
            ]
        });

        const result = await menuService.getMenuItems();
        expect(result.documents).toHaveLength(2);
        expect(result.documents[0].name).toBe('Burger');
    });

    test('createMenuItem: creates item without image', async () => {
        databases.createDocument.mockResolvedValue({
            $id: 'item1',
            name: 'Pasta',
            price: 200
        });

        const result = await menuService.createMenuItem({
            name: 'Pasta',
            price: 200,
            category: 'Italian'
        });

        expect(result.name).toBe('Pasta');
        expect(storage.createFile).not.toHaveBeenCalled();
    });

    test('createMenuItem: creates item with image upload', async () => {
        storage.createFile.mockResolvedValue({ $id: 'file1' });
        storage.getFileView.mockReturnValue({ href: 'https://example.com/image.jpg' });
        databases.createDocument.mockResolvedValue({
            $id: 'item1',
            imageUrl: 'https://example.com/image.jpg'
        });

        const result = await menuService.createMenuItem(
            { name: 'Burger', price: 150 },
            { uri: 'file://image.jpg' }
        );

        expect(storage.createFile).toHaveBeenCalled();
        expect(result.imageUrl).toBe('https://example.com/image.jpg');
    });

    test('updateMenuItem: updates item data', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'item1',
            name: 'Updated Burger',
            price: 180
        });

        const result = await menuService.updateMenuItem('item1', {
            name: 'Updated Burger',
            price: 180
        });

        expect(result.name).toBe('Updated Burger');
    });

    test('toggleAvailability: toggles item availability', async () => {
        databases.updateDocument.mockResolvedValue({
            $id: 'item1',
            available: false
        });

        const result = await menuService.toggleAvailability('item1', true);
        expect(result.available).toBe(false);
    });

    test('updateSectionStatus: updates all items in section', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [
                { $id: '1', section: 'breakfast' },
                { $id: '2', section: 'breakfast' }
            ]
        });
        databases.updateDocument.mockResolvedValue({});

        await menuService.updateSectionStatus('breakfast', true);

        expect(databases.updateDocument).toHaveBeenCalledTimes(2);
    });

    // SAD PATHS (Error Handling)
    test('createMenuItem: fails if storage upload fails', async () => {
        storage.createFile.mockRejectedValue(new Error('Storage Full'));

        await expect(
            menuService.createMenuItem(
                { name: 'Food' },
                { uri: 'file://image.jpg' }
            )
        ).rejects.toThrow('Storage Full');

        // Ensure database was never called because upload failed
        expect(databases.createDocument).not.toHaveBeenCalled();
    });

    test('createMenuItem: fails if database write fails after upload', async () => {
        storage.createFile.mockResolvedValue({ $id: 'file1' });
        storage.getFileView.mockReturnValue({ href: 'https://example.com/image.jpg' });
        databases.createDocument.mockRejectedValue(new Error('DB Error'));

        await expect(
            menuService.createMenuItem(
                { name: 'Food' },
                { uri: 'file://image.jpg' }
            )
        ).rejects.toThrow('DB Error');
    });

    test('getMenuItems: throws error on network failure', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Network Error'));

        await expect(menuService.getMenuItems()).rejects.toThrow('Network Error');
    });

    test('toggleAvailability: throws error on permission denied', async () => {
        databases.updateDocument.mockRejectedValue(new Error('Unauthorized'));

        await expect(menuService.toggleAvailability('item1', true)).rejects.toThrow('Unauthorized');
    });

    test('updateSectionStatus: throws error on database failure', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Database Error'));

        await expect(menuService.updateSectionStatus('breakfast', true)).rejects.toThrow('Database Error');
    });
});
