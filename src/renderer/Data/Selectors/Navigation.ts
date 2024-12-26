import { createSelector } from "@reduxjs/toolkit";
import { State, NavigationState } from "../Objects/State"

const getNavState = (state: State) => {
    return state.Navigation;
};

const currentPage = (state: NavigationState) => {
    return state.currentPage
}

const currentRole = (state: NavigationState) => {
    return state.groupRole
}

const currentRoom = (state: NavigationState) => {
    return state.room
}

export const getCurrentPage = createSelector(
    getNavState,
    currentPage
)

export const getCurrentRole = createSelector(
    getNavState,
    currentRole
)

export const getCurrentRoom = createSelector(
    getNavState,
    currentRoom
)