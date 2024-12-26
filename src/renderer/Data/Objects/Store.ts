import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from "../Reducers/User"
import navReducer from "../Reducers/Navigation"

import { persistStore,
         persistReducer,
         FLUSH,
         REHYDRATE,
         PAUSE,
         PERSIST,
         PURGE,
         REGISTER, } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const reducerMap = {
    User: userReducer,
    Navigation: navReducer,
    
};

const rootReducer = combineReducers({
    User: userReducer,
    Navigation: navReducer
});

const persistConfig = {
    key: 'root',
    storage,
  }

const persistedReducer = persistReducer(persistConfig, rootReducer)
  
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
});

export const persistor = persistStore(store)
export default store;