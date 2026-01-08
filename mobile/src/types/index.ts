export interface MenuItem {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url?: string;
    is_available: boolean;
    is_vegetarian: boolean;
}
