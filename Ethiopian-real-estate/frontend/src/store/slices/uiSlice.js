import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  language: 'en',
  modalOpen: false,
  modalContent: null,
  loadingOverlay: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setLanguage: (state, action) => {
      state.language = action.payload
    },
    openModal: (state, action) => {
      state.modalOpen = true
      state.modalContent = action.payload
    },
    closeModal: (state) => {
      state.modalOpen = false
      state.modalContent = null
    },
    showLoadingOverlay: (state) => {
      state.loadingOverlay = true
    },
    hideLoadingOverlay: (state) => {
      state.loadingOverlay = false
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLanguage,
  openModal,
  closeModal,
  showLoadingOverlay,
  hideLoadingOverlay,
} = uiSlice.actions

export default uiSlice.reducer
