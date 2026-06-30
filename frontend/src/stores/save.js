import { defineStore } from 'pinia'
import { ref } from 'vue'
import { gameApi } from '@/api/game'

export const useSaveStore = defineStore('save', () => {
  const saves = ref([])
  const currentSave = ref(null)
  const loading = ref(false)

  async function fetchSaves() {
    loading.value = true
    try {
      const response = await gameApi.listSaveSlots()
      saves.value = response.data
    } catch (error) {
      console.error('Failed to fetch saves:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createSave(name) {
    try {
      const response = await gameApi.createSaveSlot(name)
      saves.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create save:', error)
      throw error
    }
  }

  async function loadSave(saveId) {
    try {
      const response = await gameApi.loadData(saveId, 'auto_save')
      currentSave.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to load save:', error)
      throw error
    }
  }

  async function deleteSave(saveId) {
    try {
      await gameApi.deleteSave(saveId)
      saves.value = saves.value.filter(s => s.id !== saveId)
      if (currentSave.value?.id === saveId) {
        currentSave.value = null
      }
    } catch (error) {
      console.error('Failed to delete save:', error)
      throw error
    }
  }

  async function autoSave(gameState) {
    try {
      await gameApi.autoSave(gameState)
    } catch (error) {
      console.error('Auto-save failed:', error)
      throw error
    }
  }

  return {
    saves,
    currentSave,
    loading,
    fetchSaves,
    createSave,
    loadSave,
    deleteSave,
    autoSave
  }
})