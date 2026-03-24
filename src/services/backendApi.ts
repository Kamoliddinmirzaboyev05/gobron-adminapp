import { Booking, BookingStatus } from "../mock/bookings";
import { Field } from "../mock/fields";

const DEFAULT_API_URL = "http://localhost:3000/api/v1";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  DEFAULT_API_URL
).replace(/\/+$/, "");

type LoginPayload = {
  login: string;
  password: string;
};

type RegisterPayload = {
  fullName: string;
  login: string;
  password: string;
  role: "user" | "admin" | "superadmin";
};

type BackendLoginResponse = {
  user: {
    id: string;
    fullName: string;
    login: string;
    role: string;
    field?: any;
  };
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  token?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
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
  baseUrl: API_BASE_URL,

  async login(payload: LoginPayload): Promise<BackendLoginResponse> {
    return request<BackendLoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  async register(payload: RegisterPayload): Promise<BackendLoginResponse> {
    return request<BackendLoginResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  async getMe(token: string): Promise<BackendLoginResponse["user"]> {
    return request<BackendLoginResponse["user"]>("/auth/me", { token });
  },

  async updateProfile(token: string, data: any): Promise<any> {
    return request<any>("/auth/profile", {
      method: "POST",
      token,
      body: data,
    });
  },

  async getMyField(token: string): Promise<Field> {
    const raw = await request<any>("/fields/admin/my", { token });
    return mapBackendField(raw);
  },

  async updateMyField(token: string, data: Partial<Field>): Promise<Field> {
    const raw = await request<any>("/fields/admin/my", {
      method: "PATCH",
      token,
      body: data,
    });
    return mapBackendField(raw);
  },

  async getAdminBookings(token: string): Promise<Booking[]> {
    const raws = await request<any[]>("/bookings/admin", { token });
    return raws.map(mapBackendBooking);
  },

  async updateBookingStatus(
    token: string,
    bookingId: string,
    status: BookingStatus,
    rejectReason?: string,
  ): Promise<Booking> {
    const raw = await request<any>(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      token,
      body: { status, rejectReason },
    });
    return mapBackendBooking(raw);
  },
};
