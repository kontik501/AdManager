import { Socket } from "socket.io-client";

export interface IApiUser {
    token: string,
    user: IUser
}

export interface IUser{
    email: string;
    firstname: string;
    secondname: string;
}

export interface ILogInUserPayLoad {
    email: string;
    password: string;    
}

export interface IRegisterUserPayLoad {
    email: string;
    firstname: string;
    secondname: string;
    password: string;    
}

export interface ICreateGroupPayLoad {
    name: string;
    email: string;
}

export interface ISocket{
    socket: Socket
}