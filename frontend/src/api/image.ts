const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getImageUrl(
  entityType: string,
  entityKey: string,
  imageType: string = 'portrait'
): string {
  return `${API_BASE}/api/images/${entityType}/${entityKey}?type=${imageType}`
}

export const imageApi = {
  getUrl: getImageUrl,
}
