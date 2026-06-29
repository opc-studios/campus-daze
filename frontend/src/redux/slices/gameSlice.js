import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentScene: 'plaza',
  battleState: null,
  tasks: [],
  areas: [],
  npcs: [],
  rewards: [],
  achievements: [],
  chatMessages: [],
  onlineUsers: [],
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentScene: (state, action) => {
      state.currentScene = action.payload
    },
    startBattle: (state, action) => {
      state.battleState = { ...action.payload, turn: 'player' }
    },
    endBattle: (state, action) => {
      state.battleState = null
    },
    updateBattleState: (state, action) => {
      if (state.battleState) {
        state.battleState = { ...state.battleState, ...action.payload }
      }
    },
    setTasks: (state, action) => {
      state.tasks = action.payload
    },
    setAreas: (state, action) => {
      state.areas = action.payload
    },
    setNPCs: (state, action) => {
      state.npcs = action.payload
    },
    setRewards: (state, action) => {
      state.rewards = action.payload
    },
    setAchievements: (state, action) => {
      state.achievements = action.payload
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload)
      if (state.chatMessages.length > 50) {
        state.chatMessages.shift()
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
  },
})

export const { setCurrentScene, startBattle, endBattle, updateBattleState, setTasks, setAreas, setNPCs, setRewards, setAchievements, addChatMessage, setOnlineUsers } = gameSlice.actions
export default gameSlice.reducer