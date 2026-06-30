import api from './index'

export const gameApi = {
  listAreas: () => {
    return api.get('/maps/areas/')
  },

  getArea: (areaId) => {
    return api.get(`/maps/areas/${areaId}/`)
  },

  exploreArea: (areaId) => {
    return api.post(`/maps/areas/${areaId}/explore/`)
  },

  listChapters: () => {
    return api.get('/chapters/')
  },

  getChapter: (chapterId) => {
    return api.get(`/chapters/${chapterId}/`)
  },

  advanceScene: (chapterId) => {
    return api.post(`/chapters/${chapterId}/advance/`)
  },

  startBattle: (characterId, enemyId) => {
    return api.post(`/gameplay/battle/start/${characterId}/`, { enemy_id: enemyId })
  },

  getEnemies: () => {
    return api.get('/gameplay/enemies/')
  },

  battleAction: (battleId, action, data = {}) => {
    return api.post(`/gameplay/battle/${battleId}/action/`, { action, ...data })
  },

  getBattleResult: (battleId) => {
    return api.get(`/gameplay/battle/${battleId}/result/`)
  },

  listTasks: (type = null) => {
    const params = type ? { type } : {}
    return api.get('/gameplay/tasks/', { params })
  },

  acceptTask: (taskId, characterId) => {
    return api.post(`/gameplay/tasks/${taskId}/accept/${characterId}/`)
  },

  listRewards: () => {
    return api.get('/gameplay/rewards/')
  },

  startRest: (characterId) => {
    return api.post(`/gameplay/rest/start/${characterId}/`)
  },

  endRest: (restId) => {
    return api.post(`/gameplay/rest/end/${restId}/`)
  },

  getOfflineRewards: (characterId) => {
    return api.get(`/gameplay/rest/offline/${characterId}/`)
  },

  listNpcs: (areaId = null) => {
    const params = areaId ? { area_id: areaId } : {}
    return api.get('/dialogue/npcs/', { params })
  },

  getDialogue: (npcId) => {
    return api.get(`/dialogue/npcs/${npcId}/dialogue/`)
  },

  respondToDialogue: (npcId, dialogueId, choiceId = null) => {
    return api.post(`/dialogue/npcs/${npcId}/dialogue/${dialogueId}/respond/`, { choice_id: choiceId })
  },

  listStages: (chapterId = null) => {
    const params = chapterId ? { chapter_id: chapterId } : {}
    return api.get('/stages/', { params })
  },

  getStageProgress: () => {
    return api.get('/stages/progress/')
  },

  completeStage: (stageId, score) => {
    return api.post(`/stages/${stageId}/complete/`, { score })
  },

  listSaveSlots: () => {
    return api.get('/saves/slots/')
  },

  createSaveSlot: (name) => {
    return api.post('/saves/slots/create/', { name })
  },

  saveData: (slotId, key, value) => {
    return api.post(`/saves/slots/${slotId}/save/`, { key, value })
  },

  loadData: (slotId, key) => {
    return api.get(`/saves/slots/${slotId}/load/${key}/`)
  },

  deleteSave: (slotId) => {
    return api.delete(`/saves/slots/${slotId}/delete/`)
  },

  autoSave: (gameState) => {
    return api.post('/saves/auto-save/', { game_state: gameState })
  }
}
