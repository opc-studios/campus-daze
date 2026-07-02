import apiClient from './client'

export interface ResolveEventRequest {
  eventId: string
  optionIndex: number
}

export interface ResolveEventResponse {
  rewards: Array<{
    type: string
    amount?: number
    itemId?: string
    stat?: string
    value?: number
    duration?: number
  }>
  consequence?: string
}

export const eventApi = {
  resolveEvent: async (data: ResolveEventRequest): Promise<ResolveEventResponse> => {
    const response = await apiClient.post('/api/event/resolve', data)
    return response.data
  }
}
