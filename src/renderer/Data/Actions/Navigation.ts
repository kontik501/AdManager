import { createAction } from "@reduxjs/toolkit";
import { Pages, Roles } from "../Objects/State"

export const setActivePage = createAction<Pages>("SET_ACTIVE_PAGE");

export const setGroupRole = createAction<Roles>("SET_GROUP_ROLE");