import { databases, DATABASE_ID, COLLECTIONS } from '../services/appwrite';
import { Query } from 'react-native-appwrite';

jest.mock('../services/appwrite', () => ({
    databases: {
        listDocuments: jest.fn(),
        createDocument: jest.fn(),
        updateDocument: jest.fn(),
    },
    storage: {
        createFile: jest.fn(),
        getFileView: jest.fn(),
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        MENU_ITEMS: 'menu_items',
    },
    BUCKET_ID: 'test-bucket',
}));

describe('Menu Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch all menu items', async () => {
        const mockMenuItems = {
            documents: [
                {
                    $id: 'item-1',
                    name: 'Burger',
                    price: 150,
                    category: 'Fast Food',
                    available: true,
                },
                {
                    $id: 'item-2',
                    name: 'Pizza',
                    price: 300,
                    category: 'Fast Food',
                    available: true,
                },
            ],
            total: 2,
        };

        databases.listDocuments.mockResolvedValue(mockMenuItems);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS
        );

        expect(result.documents).toHaveLength(2);
        expect(result.documents[0].name).toBe('Burger');
        expect(databases.listDocuments).toHaveBeenCalledWith(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS
        );
    });

    test('should create a new menu item', async () => {
        const newItem = {
            $id: 'item-3',
            name: 'Pasta',
            price: 200,
            category: 'Italian',
            available: true,
        };

        databases.createDocument.mockResolvedValue(newItem);

        const result = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS,
            'item-3',
            {
                name: 'Pasta',
                price: 200,
                category: 'Italian',
                available: true,
            }
        );

        expect(result.name).toBe('Pasta');
        expect(result.price).toBe(200);
    });

    test('should update menu item availability', async () => {
        const updatedItem = {
            $id: 'item-1',
            available: false,
        };

        databases.updateDocument.mockResolvedValue(updatedItem);

        const result = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS,
            'item-1',
            { available: false }
        );

        expect(result.available).toBe(false);
    });

    test('should fetch menu items by category', async () => {
        const mockCategoryItems = {
            documents: [
                {
                    $id: 'item-1',
                    name: 'Burger',
                    category: 'Fast Food',
                },
            ],
            total: 1,
        };

        databases.listDocuments.mockResolvedValue(mockCategoryItems);

        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.MENU_ITEMS,
            [Query.equal('category', 'Fast Food')]
        );

        expect(result.documents[0].category).toBe('Fast Food');
    });
});
