import { ICreateGroupPayLoad, ILogInUserPayLoad, IRegisterUserPayLoad } from "../Interfaces";
import { Request } from "./Network";

export const loginUser = (payload: ILogInUserPayLoad, token: string) => {
    return Request("login", token, "POST", undefined, payload);
}
export const registerUser = (payload: IRegisterUserPayLoad, token: string) => {
    return Request("register", token, "POST", undefined, payload);
}