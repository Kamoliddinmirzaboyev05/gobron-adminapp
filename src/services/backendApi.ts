import apiClient from './apiClient';
import { Booking, BookingStatus } from '../types';
import { Field } from '../types';

async function request<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT', body?: unknown } = {}): Promise<T> {
  const response = await apiClient({
    method: options.method || 'GET',
    url: path,
    data: options.body,
  });
  return response.data;
}

function toDateLabel(dateValue?: string | Date | null): string {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  const key = fmt(d);
  if (key === fmt(today)) return "Bugun";
  if (key === fmt(tomorrow)) return "Ertaga";
  return `${d.getDate()}-${d.getMonth() + 1}`;
}

export function mapBackendField(raw: any): Field {
  return {
    id: raw.id,
    name: raw.name || "Maydon",
    address: raw.address || "",
    city: raw.city || "Toshkent",
    lat: raw.lat || null,
    lng: raw.lng || null,
    pricePerHour: Number(raw.pricePerHour || 0),
    openTime: raw.openTime || "08:00",
    closeTime: raw.closeTime || "22:00",
    size: raw.size || "7x7",
    surface: raw.surface || "Sun'iy o't",
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    images: Array.isArray(raw.images) ? raw.images : [],
    description: raw.description || "",
    phone: raw.phone || "",
    isActive: Boolean(raw.isActive),
  };
}

export function mapBackendBooking(raw: any): Booking {
  const bookingDate = raw.bookingDate ? new Date(raw.bookingDate) : null;
  const dateKey = bookingDate ? bookingDate.toISOString().slice(0, 10) : undefined;
  const status = (raw.status || "pending") as BookingStatus;
  return {
    id: raw.id,
    fieldId: raw.fieldId,
    fieldName: raw.field?.name || "Maydon",
    userName: [raw.user?.firstName, raw.user?.lastName].filter(Boolean).join(" ") || "Foydalanuvchi",
    userPhone: raw.user?.phone || "-",
    date: dateKey,
    dateKey,
    dateLabel: toDateLabel(raw.bookingDate),
    startTime: raw.startTime || "00:00",
    endTime: raw.endTime || "00:00",
    totalPrice: Number(raw.totalPrice || 0),
    status,
    createdAt: raw.createdAt || new Date().toISOString(),
    rejectReason: raw.rejectReason || undefined,
    note: raw.note || undefined,
  };
}

export const backendApi = {
  login: (payload: any) => request<any>("/auth/login", { method: "POST", body: payload }),
  register: (payload: any) => request<any>("/auth/register", { method: "POST", body: payload }),
  getMe: () => request<any>("/auth/me"),
  getAdminBookings: () => request<Booking[]>("/bookings/admin").then(res => res.map(mapBackendBooking)),
  updateBookingStatus: (id: string, status: BookingStatus, reason?: string) =>
    request<any>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: { status, reason },
    }).then(mapBackendBooking),
  getMyField: () => request<any>("/fields/my-field").then(mapBackendField),
  updateMyField: (data: Partial<Field>) =>
    request<any>("/fields/my-field", {
      method: "PATCH",
      body: data,
    }).then(mapBackendField),
};
