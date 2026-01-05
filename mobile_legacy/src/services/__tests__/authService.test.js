import { authService } from '../authService';
import { account, databases } from '../appwrite';

jest.mock('../appwrite', () => ({
    account: {
        createEmailPasswordSession: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
        deleteSession: jest.fn()
    },
    databases: {
        listDocuments: jest.fn(),
        createDocument: jest.fn()
    },
    DATABASE_ID: 'test-db',
    COLLECTIONS: {
        USERS: 'users',
        ADMIN: 'admin'
    },
    ID: { unique: () => 'unique-id' },
    Query: {
        limit: jest.fn((value) => `Query.limit(${value})`)
    }
}));

describe('authService High Coverage', () => {
    beforeEach(() => jest.clearAllMocks());

    // HAPPY PATHS
    test('login: successful admin login', async () => {
        account.createEmailPasswordSession.mockResolvedValue({
            userId: 'admin-123'
        });

        account.get.mockResolvedValue({
            $id: 'admin-123',
            email: 'admin@college.edu',
            name: 'Admin User'
        });

        databases.listDocuments.mockResolvedValue({
            documents: [{ userId: 'admin-123', role: 'admin' }]
        });

        const result = await authService.login('admin@college.edu', 'password');

        expect(result.session.userId).toBe('admin-123');
        expect(result.user.email).toBe('admin@college.edu');
        expect(result.isAdmin).toBe(true);
    });

    test('login: successful student login', async () => {
        account.createEmailPasswordSession.mockResolvedValue({
            userId: 'student-123'
        });

        account.get.mockResolvedValue({
            $id: 'student-123',
            email: 'student@college.edu',
            name: 'Student User'
        });

        databases.listDocuments.mockResolvedValue({
            documents: []
        });

        const result = await authService.login('student@college.edu', 'password');

        expect(result.session.userId).toBe('student-123');
        expect(result.isAdmin).toBe(false);
    });

    test('register: creates account and user profile', async () => {
        account.create.mockResolvedValue({
            $id: 'user-123',
            email: 'new@college.edu'
        });

        databases.createDocument.mockResolvedValue({
            $id: 'profile-123',
            userId: 'user-123',
            role: 'student'
        });

        const result = await authService.register(
            'new@college.edu',
            'password',
            'New User'
        );

        expect(result.account.$id).toBe('user-123');
        expect(result.profile.role).toBe('student');
        expect(account.create).toHaveBeenCalled();
        expect(databases.createDocument).toHaveBeenCalled();
    });

    test('logout: deletes current session', async () => {
        account.deleteSession.mockResolvedValue({});

        await authService.logout();

        expect(account.deleteSession).toHaveBeenCalledWith('current');
    });

    test('getCurrentUser: returns user with admin status', async () => {
        account.get.mockResolvedValue({
            $id: 'user-123',
            email: 'user@college.edu'
        });

        databases.listDocuments.mockResolvedValue({
            documents: [{ userId: 'user-123' }]
        });

        const result = await authService.getCurrentUser();

        expect(result.user.$id).toBe('user-123');
        expect(result.isAdmin).toBe(true);
    });

    test('checkAdminStatus: returns true for admin user', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ userId: 'admin-123', role: 'admin' }]
        });

        const result = await authService.checkAdminStatus('admin-123');
        expect(result).toBe(true);
    });

    test('checkAdminStatus: returns false for non-admin user', async () => {
        databases.listDocuments.mockResolvedValue({
            documents: [{ userId: 'other-user', role: 'admin' }]
        });

        const result = await authService.checkAdminStatus('student-123');
        expect(result).toBe(false);
    });

    // SAD PATHS (Error Handling)
    test('login: throws error on invalid credentials', async () => {
        account.createEmailPasswordSession.mockRejectedValue(
            new Error('Invalid credentials')
        );

        await expect(
            authService.login('wrong@email.com', 'wrongpass')
        ).rejects.toThrow('Invalid credentials');
    });

    test('register: throws error when user already exists', async () => {
        account.create.mockRejectedValue(new Error('User already exists'));

        await expect(
            authService.register('existing@college.edu', 'password', 'Name')
        ).rejects.toThrow('User already exists');

        // Ensure profile was never created
        expect(databases.createDocument).not.toHaveBeenCalled();
    });

    test('register: throws error on profile creation failure', async () => {
        account.create.mockResolvedValue({ $id: 'user-123' });
        databases.createDocument.mockRejectedValue(new Error('Database Error'));

        await expect(
            authService.register('new@college.edu', 'password', 'Name')
        ).rejects.toThrow('Database Error');
    });

    test('logout: throws error on session deletion failure', async () => {
        account.deleteSession.mockRejectedValue(new Error('Logout Failed'));

        await expect(authService.logout()).rejects.toThrow('Logout Failed');
    });

    test('getCurrentUser: throws error when not authenticated', async () => {
        account.get.mockRejectedValue(new Error('Not authenticated'));

        await expect(authService.getCurrentUser()).rejects.toThrow('Not authenticated');
    });

    test('checkAdminStatus: returns false on database error', async () => {
        databases.listDocuments.mockRejectedValue(new Error('Database Error'));

        const result = await authService.checkAdminStatus('user-123');
        expect(result).toBe(false);
    });
});
