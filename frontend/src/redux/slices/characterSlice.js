import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  characters: [],
  currentCharacter: null,
  equipment: [],
  skills: [],
}

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setCharacters: (state, action) => {
      state.characters = action.payload
    },
    setCurrentCharacter: (state, action) => {
      state.currentCharacter = action.payload
    },
    addCharacter: (state, action) => {
      state.characters.push(action.payload)
    },
    updateCharacter: (state, action) => {
      const index = state.characters.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.characters[index] = { ...state.characters[index], ...action.payload }
      }
      if (state.currentCharacter && state.currentCharacter.id === action.payload.id) {
        state.currentCharacter = { ...state.currentCharacter, ...action.payload }
      }
    },
    setEquipment: (state, action) => {
      state.equipment = action.payload
    },
    setSkills: (state, action) => {
      state.skills = action.payload
    },
    transformCharacter: (state, action) => {
      if (state.currentCharacter) {
        state.currentCharacter.current_form = action.payload
      }
    },
  },
})

export const { setCharacters, setCurrentCharacter, addCharacter, updateCharacter, setEquipment, setSkills, transformCharacter } = characterSlice.actions
export default characterSlice.reducer