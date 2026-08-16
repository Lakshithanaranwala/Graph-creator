import { create } from 'zustand'
import type { TransformResult } from '@/types/transform'

type TransformState = {
  result: TransformResult | null
  computing: boolean

  setResult: (result: TransformResult | null) => void
  setComputing: (computing: boolean) => void
  reset: () => void
}

export const useTransformStore = create<TransformState>((set) => ({
  result: null,
  computing: false,

  setResult: (result) => set({ result, computing: false }),
  setComputing: (computing) => set({ computing }),
  reset: () => set({ result: null, computing: false }),
}))
