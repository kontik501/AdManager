import { createReducer, ActionReducerMapBuilder, PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "../Objects/State";
import { IApiUser } from "../Interfaces";
import { loginUserAsync, logoutUserAsync, registerUserAsync } from "../Actions/User";

const defaultState: UserState = {
    token: "",
    currentUser: undefined
};

const handleLoginUserAsync = (state: UserState, action: PayloadAction<IApiUser>) => {
    if(!action?.payload){
        return state;
    }

    const{ user, token } = action?.payload;


    state.currentUser = user;
    state.token = token;
}

const handleRegisterUserAsync = (state: UserState, action: PayloadAction<IApiUser>) => {
    if(!action?.payload){
        return state;
    }

    const{ user, token } = action?.payload;


    state.currentUser = user;
    state.token = token;
}

const handleLogOutUser = (state: UserState) => {
    state.currentUser = undefined;
    state.token = ""
}

const reducerBuilder = (builder: ActionReducerMapBuilder<UserState>) => {
    builder.addCase(loginUserAsync.fulfilled, handleLoginUserAsync);
    builder.addCase(registerUserAsync.fulfilled, handleRegisterUserAsync);
    builder.addCase(logoutUserAsync, handleLogOutUser);
}

export default createReducer(defaultState, reducerBuilder);