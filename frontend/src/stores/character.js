import { defineStore } from 'pinia'
import { ref } from 'vue'
import { characterApi } from '@/api/character'

export const useCharacterStore = defineStore('character', () => {
  const characters = ref([])
  const currentCharacter = ref(null)
  const templates = ref([])
  const professions = ref([])

  const fetchCharacters = async () => {
    const response = await characterApi.listCharacters()
    characters.value = response
  }

  const fetchCurrentCharacter = async (characterId) => {
    const response = await characterApi.getCharacter(characterId)
    currentCharacter.value = response
  }

  const createCharacter = async (name, templateId, professionId) => {
    const response = await characterApi.createCharacter(name, templateId, professionId)
    characters.value.push(response)
    return response
  }

  const fetchTemplates = async () => {
    const response = await characterApi.listTemplates()
    templates.value = response
  }

  const fetchProfessions = async () => {
    const response = await characterApi.listProfessions()
    professions.value = response
  }

  const transformForm = async (characterId, formType) => {
    const response = await characterApi.transformForm(characterId, formType)
    if (currentCharacter.value?.id === characterId) {
      currentCharacter.value = response
    }
    const idx = characters.value.findIndex(c => c.id === characterId)
    if (idx !== -1) {
      characters.value[idx] = response
    }
  }

  return {
    characters,
    currentCharacter,
    templates,
    professions,
    fetchCharacters,
    fetchCurrentCharacter,
    createCharacter,
    fetchTemplates,
    fetchProfessions,
    transformForm
  }
})
