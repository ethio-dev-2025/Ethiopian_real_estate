import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  listings: [],
  currentListing: null,
  favorites: [],
  loading: false,
  error: null,
  filters: {
    listingType: null,
    propertyType: null,
    minPrice: null,
    maxPrice: null,
    city: null,
    region: null,
    bedrooms: null,
  },
}

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload
    },
    setCurrentListing: (state, action) => {
      state.currentListing = action.payload
    },
    addListing: (state, action) => {
      state.listings.unshift(action.payload)
    },
    updateListing: (state, action) => {
      const index = state.listings.findIndex(l => l.id === action.payload.id)
      if (index !== -1) {
        state.listings[index] = action.payload
      }
      if (state.currentListing?.id === action.payload.id) {
        state.currentListing = action.payload
      }
    },
    deleteListing: (state, action) => {
      state.listings = state.listings.filter(l => l.id !== action.payload)
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload
    },
    addFavorite: (state, action) => {
      state.favorites.push(action.payload)
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(f => f.id !== action.payload)
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setListings,
  setCurrentListing,
  addListing,
  updateListing,
  deleteListing,
  setFavorites,
  addFavorite,
  removeFavorite,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  clearError,
} = propertySlice.actions

export default propertySlice.reducer
