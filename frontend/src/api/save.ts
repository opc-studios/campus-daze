import apiClient from './client'
import type { GameState } from '../types/game'

export interface SaveResponse {
  state: GameState
  state_version: number
}

export interface PutSaveRequest {
  state: GameState
  state_version: number
}

export const saveApi = {
  getSave: async (): Promise<SaveResponse> => {
    const response = await apiClient.get('/api/save')
    return response.data
  },

  putSave: async (data: PutSaveRequest): Promise<{ state_version: number }> => {
    const response = await apiClient.put('/api/save', data)
    return response.data
  }
}
