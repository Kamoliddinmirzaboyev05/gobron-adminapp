import { create } from 'zustand';
import { Field } from '../types';
import { backendApi } from '../services/backendApi';

interface FieldStore {
  fields: Field[];
  activeFieldId: string;
  isLoading: boolean;
  loadMyField: () => Promise<void>;
  saveMyField: (data: Partial<Field>) => Promise<void>;
  setActiveField: (id: string) => void;
  updateField: (id: string, data: Partial<Field>) => void;
  addField: (field: Omit<Field, 'id'>) => void;
}

export const useFieldStore = create<FieldStore>((set) => ({
  fields: [],
  activeFieldId: '',
  isLoading: false,

  loadMyField: async () => {
    set({ isLoading: true });
    try {
      const field = await backendApi.getMyField();
      set({
        fields: [field],
        activeFieldId: field.id,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  saveMyField: async (data) => {
    const field = await backendApi.updateMyField(data);
    set({
      fields: [field],
      activeFieldId: field.id,
    });
  },

  setActiveField: (id) => set({ activeFieldId: id }),

  updateField: (id, data) =>
    set(state => ({
      fields: state.fields.map(f => (f.id === id ? { ...f, ...data } : f)),
    })),

  addField: (field) =>
    set(state => {
      const newField: Field = { ...field, id: `field-${Date.now()}` };
      return {
        fields: [...state.fields, newField],
        activeFieldId: newField.id,
      };
    }),
}));
