import { createReducer, ActionReducerMapBuilder, PayloadAction, buildCreateSlice } from "@reduxjs/toolkit";
import { NavigationState, Pages, Roles } from "../Objects/State";
import update from "immutability-helper"
import { setActivePage, setGroupRole } from "../Actions/Navigation";


const defaultState: NavigationState = {
    currentPage: Pages.LOGIN,
    groupRole: Roles.NONE,
    room: ""
}

const handleSetActivePage = (state: NavigationState, action: PayloadAction<Pages>) => {
    if (!action?.payload) {
        return state
    }

    return update(state, {
        currentPage: {
            $set: action?.payload
        }
    })
}

const handleSetGroupRole = (state: NavigationState, action: PayloadAction<Roles>) => {
    if (!action?.payload) {
        return state
    }

    return update(state, {
        groupRole: {
            $set: action?.payload
        }
    })
}

const reducerBuilder = (builder: ActionReducerMapBuilder<NavigationState>) => {
    builder.addCase(setActivePage.type, handleSetActivePage)
    builder.addCase(setGroupRole.type, handleSetGroupRole)
};

export default createReducer(defaultState, reducerBuilder)