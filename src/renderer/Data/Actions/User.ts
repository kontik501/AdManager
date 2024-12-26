import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { IApiUser, ILogInUserPayLoad, IRegisterUserPayLoad } from "../Interfaces";
import * as UserAPI from "../API/User"
import { getAuthToken } from "../Selectors/User";
import { State } from "../Objects/State"

export const loginUserAsync = createAsyncThunk<IApiUser, ILogInUserPayLoad, { state: State }> (
    "LOGIN_USER",
    async (payload: ILogInUserPayLoad, { getState } ) => {
        return UserAPI.loginUser(payload, getAuthToken(getState())) as Promise<IApiUser>;
    }
)

export const registerUserAsync = createAsyncThunk <IApiUser, IRegisterUserPayLoad, { state: State }> (
    "REGISTER_USER",
    async(payload: IRegisterUserPayLoad, { getState } ) => {
        return UserAPI.registerUser(payload,getAuthToken(getState())) as Promise<IApiUser>;
    }
)

export const logoutUserAsync = createAction('LOGOUT_USER')