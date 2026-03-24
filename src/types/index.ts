export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  userName: string;
  userPhone: string;
  date?: string;
  dateKey?: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  slots?: string[];
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  rejectReason?: string;
  note?: string;
}

export interface Field {
  id: string;
  name: string;
  address: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  size: string;
  surface: string;
  amenities: string[];
  images: string[];
  description: string;
  phone: string;
  isActive: boolean;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  telegramId: string;
  telegramHandle: string;
  location: string;
  avatar: string | null;
  subscription: {
    plan: string;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
    daysLeft: number;
    totalDays: number;
  };
  stats: {
    todayBookings: number;
    monthBookings: number;
    monthRevenue: number;
    confirmRate: number;
    cancelRate: number;
    totalFields: number;
  };
}
