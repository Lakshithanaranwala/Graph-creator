import { create } from 'zustand'
import type { ColumnProfile, InferredType } from '@/types/profile'

type ProfileState = {
  profiles: ColumnProfile[]
  // User overrides keyed by column index — persisted until the sheet changes
  typeOverrides: Record<number, InferredType>
  expandedColumnIndex: number | null

  setProfiles: (profiles: ColumnProfile[]) => void
  setTypeOverride: (colIndex: number, type: InferredType) => void
  clearOverrides: () => void
  setExpandedColumnIndex: (index: number | null) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: [],
  typeOverrides: {},
  expandedColumnIndex: null,

  setProfiles: (profiles) => set({ profiles }),
  setTypeOverride: (colIndex, type) =>
    set((s) => ({ typeOverrides: { ...s.typeOverrides, [colIndex]: type } })),
  clearOverrides: () => set({ typeOverrides: {}, expandedColumnIndex: null }),
  setExpandedColumnIndex: (index) => set({ expandedColumnIndex: index }),
}))
