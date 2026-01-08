import { apiClient as client } from '../api/client';
import { AxiosResponse } from 'axios';


export interface AdminStats {
    counts: {
        Pending: number;
        Preparing: number;
        Ready: number;
        Completed: number;
        Paid: number;
        Pending_Verification: number;
        Revenue: number;
        Total_Orders: number;
    };
    revenue: {
        total: number;
        today: number;
    };
}

export interface Setting {
    key: string;
    value: string;
    category: string;
    description?: string;
}

export interface AdminOrder {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
    user_id: number;
    items: any[];
    otp?: string;
    verification_proof?: string;
    payment_submitted: boolean;
    user?: {
        username: string;
        email?: string;
        role: string;
    };
}

export const adminService = {

    getStats: async (): Promise<AdminStats> => {
        const response = await client.get('/admin/stats');
        return response.data;
    },

    getSettings: async (): Promise<Setting[]> => {
        const response = await client.get('/admin/settings');
        return response.data;
    },

    updateSetting: async (key: string, value: string, category: string = 'general') => {
        const response = await client.post('/admin/settings', { key, value, category });
        return response.data;
    },

    getOrders: async (status?: string): Promise<AdminOrder[]> => {
        const params = status ? { status } : {};
        const response = await client.get('/admin/orders', { params });
        return response.data;
    },

    updateOrderStatus: async (orderId: number, status: string) => {
        const response = await client.patch(`/admin/orders/${orderId}/status`, { status });
        return response.data;
    },

    verifyPayment: async (orderId: number, verifiedBy: string) => {
        const response = await client.post('/payments/verify', { order_id: orderId, verified_by: verifiedBy });
        return response.data;
    },

    rejectPayment: async (orderId: number, rejectedBy: string, reason: string) => {
        const response = await client.post('/payments/reject', { order_id: orderId, rejected_by: rejectedBy, reason: reason });
        return response.data;
    },

    // Menu Management
    addMenuItem: async (itemData: any) => {
        const response = await client.post('/menu/', itemData);
        return response.data;
    },

    updateMenuItem: async (id: number, itemData: any) => {
        const response = await client.put(`/menu/${id}`, itemData);
        return response.data;
    },

    deleteMenuItem: async (id: number) => {
        const response = await client.delete(`/menu/${id}`);
        return response.data;
    },
};




