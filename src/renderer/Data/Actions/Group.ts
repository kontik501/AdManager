import { createAsyncThunk } from "@reduxjs/toolkit";
import { IApiUser, ICreateGroupPayLoad } from "../Interfaces";
import * as GroupAPI from "../API/Group"
import { getAuthToken } from "../Selectors/User";
import { State } from "../Objects/State"

export const createGroupAsync = createAsyncThunk<IApiUser, ICreateGroupPayLoad, { state: State }>(
    "CREATE_GROUP",
    async (payload: ICreateGroupPayLoad, { getState }) => {
        return GroupAPI.createGroup(payload, getAuthToken(getState())) as Promise<IApiUser>;
    }
)
