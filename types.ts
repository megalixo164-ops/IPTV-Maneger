export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  startDate: string; // ISO Date string
  renewalDate: string; // ISO Date string
  price: number;
  devices: number;
  notes?: string;
  server?: string;
  macAddress?: string;
  devicePassword?: string;
}

export interface ClientStats {
  totalClients: number;
  activeRevenue: number;
  expiringSoon: number;
}