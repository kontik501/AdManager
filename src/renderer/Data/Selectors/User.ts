import { createSelector } from "@reduxjs/toolkit";
import { State, UserState } from "../Objects/State"


export const getUserState = (state: State) => {
    return state?.User;
}

const getUserToken = (state: UserState) => {
    return state?.token;
}

const getUser = (state: UserState) => {
    return state.currentUser
}

export const getAuthToken = createSelector(
    getUserState,
    getUserToken
)

export const getCurrentUser = createSelector(
    getUserState,
    getUser
)