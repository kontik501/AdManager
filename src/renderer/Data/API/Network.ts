import axios, { AxiosError } from "axios";

type RequestType = "GET" | "POST" | "PATCH" | "DELETE"

const baseURL = "http://127.0.0.1:6061/api";

export function Request<T>(path: string, token: string, type: RequestType, params?: any, body?: T ) {
    return new Promise((resolve, reject) => {
        axios({
            method: type,
            url: `${ baseURL }/${path}`,
            params: params,
            data: body,
            headers: {
                "Authorization": `Bearer${ token }`
            }
        })
        .then(response => {
            if(response.status === 200 && response.status < 300 ){
                resolve(response.data)
            } else{
                reject(new Error(`Request failed with status ${response.status}`));
            }
        }).catch((error: AxiosError) => {
            if (error.response) {
                
                reject(new Error(`Request failed with status ${error.response.status}`));
            } else if (error.request) {
                
                reject(new Error("Request failed: no response received"));
            } else {
                
                reject(new Error("Request failed: " + error.message));
            }
        });
    } )
}