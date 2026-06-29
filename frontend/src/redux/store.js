import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import characterReducer from './slices/characterSlice'
import gameReducer from './slices/gameSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    character: characterReducer,
    game: gameReducer,
  },
})