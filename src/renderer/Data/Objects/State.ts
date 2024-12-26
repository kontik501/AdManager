import { IUser } from "../Interfaces/User";

export enum Pages {
    LOGIN = "LOGIN",
    HOME = "HOME"
}

export enum Roles {
    OWNER = "Owner",
    MEMBER = "Member",
    ADMIN = "Admin",
    PARTICIPANT = "Participant",
    NONE = ""
}

export class State {
    constructor() {
        this.User = new UserState();
        this.Navigation = new NavigationState();
    }

    User: UserState
    Navigation: NavigationState
}

export class UserState {
    token: string;
    currentUser: IUser | undefined;
}

export class NavigationState {
    currentPage: Pages;
    groupRole: Roles;
    room: "";
}
