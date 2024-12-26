import { ICreateGroupPayLoad } from "../Interfaces";
import { Request } from "./Network";

export const createGroup = (payload: ICreateGroupPayLoad, token: string) => {
    return Request("creategroup", token, "POST", undefined, payload)
}
