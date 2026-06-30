import api from './index'

export const characterApi = {
  listCharacters: () => {
    return api.get('/characters/')
  },

  getCharacter: (characterId) => {
    return api.get(`/characters/${characterId}/`)
  },

  createCharacter: (data) => {
    return api.post('/characters/create/', {
      name: data.name,
      template: data.template_id,
      profession: data.profession_id
    })
  },

  updateCharacter: (characterId, data) => {
    return api.put(`/characters/${characterId}/update/`, data)
  },

  getEquipment: (characterId) => {
    return api.get(`/characters/${characterId}/equipment/`)
  },

  getSkills: (characterId) => {
    return api.get(`/characters/${characterId}/skills/`)
  },

  transformForm: (characterId, formType) => {
    return api.post(`/characters/${characterId}/transform/`, { form_type: formType })
  },

  listTemplates: () => {
    return api.get('/characters/templates/')
  },

  listProfessions: () => {
    return api.get('/characters/professions/')
  }
}
