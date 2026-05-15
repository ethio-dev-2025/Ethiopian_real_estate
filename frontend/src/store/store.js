import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import propertyReducer from './slices/propertySlice'
import chatReducer from './slices/chatSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'notification'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  property: propertyReducer,
  chat: chatReducer,
  notification: notificationReducer,
  ui: uiReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export default store
