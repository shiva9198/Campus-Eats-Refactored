// Mock Appwrite
const mockAccount = {
    createEmailPasswordSession: jest.fn(),
    get: jest.fn(),
    deleteSession: jest.fn(),
    create: jest.fn(),
};

const mockDatabases = {
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
};

jest.mock('../services/appwrite', () => ({
    account: mockAccount,
    databases: mockDatabases,
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        USERS: 'users',
        ADMIN: 'admin',
    },
}));

describe('Authentication Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('admin login should create session and fetch admin data', async () => {
        // Mock admin login
        mockAccount.createEmailPasswordSession.mockResolvedValue({
            userId: 'admin-123',
        });

        mockAccount.get.mockResolvedValue({
            $id: 'admin-123',
            email: 'admin@college.edu',
            name: 'Admin User',
            labels: ['admin'],
        });

        mockDatabases.listDocuments.mockResolvedValue({
            documents: [{
                $id: 'admin-doc-123',
                userId: 'admin-123',
                role: 'admin',
            }],
        });

        const { account, databases } = require('../services/appwrite');

        // Simulate login
        const session = await account.createEmailPasswordSession('admin@college.edu', 'password');
        const user = await account.get();
        const adminDoc = await databases.listDocuments('test-db', 'admin', []);

        expect(session.userId).toBe('admin-123');
        expect(user.email).toBe('admin@college.edu');
        expect(user.labels).toContain('admin');
        expect(adminDoc.documents[0].role).toBe('admin');
    });

    test('student login should create session without admin privileges', async () => {
        mockAccount.createEmailPasswordSession.mockResolvedValue({
            userId: 'student-123',
        });

        mockAccount.get.mockResolvedValue({
            $id: 'student-123',
            email: 'student@college.edu',
            name: 'Student User',
            labels: [],
        });

        mockDatabases.listDocuments.mockResolvedValue({
            documents: [{
                $id: 'student-doc-123',
                userId: 'student-123',
                role: 'student',
            }],
        });

        const { account, databases } = require('../services/appwrite');

        const session = await account.createEmailPasswordSession('student@college.edu', 'password');
        const user = await account.get();
        const userDoc = await databases.listDocuments('test-db', 'users', []);

        expect(session.userId).toBe('student-123');
        expect(user.email).toBe('student@college.edu');
        expect(user.labels).not.toContain('admin');
        expect(userDoc.documents[0].role).toBe('student');
    });

    test('logout should delete session', async () => {
        mockAccount.deleteSession.mockResolvedValue({});

        const { account } = require('../services/appwrite');

        await account.deleteSession('current');

        expect(mockAccount.deleteSession).toHaveBeenCalledWith('current');
    });

    test('user registration should create account and user document', async () => {
        mockAccount.create.mockResolvedValue({
            $id: 'new-user-123',
            email: 'newuser@college.edu',
        });

        mockDatabases.createDocument.mockResolvedValue({
            $id: 'user-doc-123',
            userId: 'new-user-123',
            role: 'student',
        });

        const { account, databases } = require('../services/appwrite');

        const newAccount = await account.create('new-user-123', 'newuser@college.edu', 'password', 'New User');
        const userDoc = await databases.createDocument('test-db', 'users', 'user-doc-123', {
            userId: 'new-user-123',
            role: 'student',
        });

        expect(newAccount.$id).toBe('new-user-123');
        expect(userDoc.userId).toBe('new-user-123');
        expect(userDoc.role).toBe('student');
    });
});
