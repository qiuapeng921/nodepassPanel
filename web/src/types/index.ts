export interface User {
    id: number;
    email: string;
    balance: number;
    is_admin: boolean;
    status: number;
}

export interface Node {
    id: number;
    name: string;
    address: string;
    status: number; // 1: Online, 0: Offline
    online_user: number;
    load: number;
    ping: number;
    country: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
}
