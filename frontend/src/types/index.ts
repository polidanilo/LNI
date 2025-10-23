export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  created_at?: string;
}

export interface Season {
  id: number;
  year: number;
  name: string;
}

export interface Shift {
  id: number;
  season_id: number;
  shift_number: number;
  start_date: string;
  end_date: string;
}

export interface Order {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: string;
  order_date: string;
  status: 'completed' | 'pending';
  notes?: string;
  created_by?: string;
  shift_id: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  attached_images?: Array<{
    url: string;
    name?: string;
    data?: string;
  }>;
}

export interface Work {
  id: number;
  title: string;
  description: string;
  category: 'Campo' | 'Officina' | 'Servizi' | 'Gommoni' | 'Barche' | 'Vele' | 'Altro';
  status: 'completed' | 'pending';
  notes: string;
  created_by: string;
  work_date: string;
  shift_id: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Boat {
  id: number;
  name: string;
  type: 'Gommone' | 'Optimist' | 'Fly' | 'Equipe' | 'Caravella' | 'Trident' | 'Canoe';
  created_at?: string;
}

export interface Problem {
  id: number;
  boat_id: number;
  description: string;
  part_affected?: string;
  status: 'open' | 'closed';
  reported_date: string;
  resolved_date?: string;
  shift_id: number;
  reported_by?: number;
  boat_name?: string;
  boat_type?: string;
}

export interface DashboardStats {
  total_expenses: number;
  total_purchases: number;
  recent_works: Work[];
  recent_purchases: Order[];
  damaged_boats: Boat[];
}