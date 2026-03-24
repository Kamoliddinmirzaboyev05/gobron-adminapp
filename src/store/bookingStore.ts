import { create } from 'zustand';
import { Booking, BookingStatus } from '../types';
import { backendApi } from '../services/backendApi';

interface BookingStore {
  bookings: Booking[];
  isLoading: boolean;
  getPending: () => Booking[];
  getPendingCount: () => number;
  getUpcoming: () => Booking[];
  getFiltered: (status?: BookingStatus | 'all', fieldId?: string) => Booking[];
  loadFromBackend: () => Promise<void>;
  confirm: (id: string) => Promise<void>;
  reject: (id: string, reason?: string) => Promise<void>;
  addManual: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  addIncoming: (data: Omit<Booking, 'id'>) => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  isLoading: false,

  getPending: () => get().bookings.filter(b => b.status === 'pending'),

  getPendingCount: () => get().bookings.filter(b => b.status === 'pending').length,

  getUpcoming: () =>
    get().bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .slice(0, 5),

  getFiltered: (status, fieldId) => {
    let list = get().bookings;
    if (status && status !== 'all') list = list.filter(b => b.status === status);
    if (fieldId && fieldId !== 'all') list = list.filter(b => b.fieldId === fieldId);
    const pending = list.filter(b => b.status === 'pending');
    const rest = list.filter(b => b.status !== 'pending');
    return [...pending, ...rest];
  },

  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const bookings = await backendApi.getAdminBookings();
      set({ bookings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  confirm: async (id) => {
    if (id.startsWith('b-')) {
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === id ? { ...b, status: 'confirmed' as BookingStatus } : b
        ),
      }));
      return;
    }
    const updated = await backendApi.updateBookingStatus(id, 'confirmed');
    set(state => ({
      bookings: state.bookings.map(b => (b.id === id ? updated : b)),
    }));
  },

  reject: async (id, reason) => {
    if (id.startsWith('b-')) {
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === id ? { ...b, status: 'rejected' as BookingStatus, rejectReason: reason } : b
        ),
      }));
      return;
    }
    const updated = await backendApi.updateBookingStatus(id, 'rejected', reason);
    set(state => ({
      bookings: state.bookings.map(b => (b.id === id ? updated : b)),
    }));
  },

  addManual: (data) =>
    set(state => ({
      bookings: [
        { ...data, id: `b-${Date.now()}`, createdAt: new Date().toISOString() },
        ...state.bookings,
      ],
    })),

  addIncoming: (data) =>
    set(state => ({
      bookings: [
        { ...data, id: `b-${Date.now()}` },
        ...state.bookings,
      ],
    })),
}));
