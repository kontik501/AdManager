import express, {
	Express, Request, Response, RequestHandler, Router, NextFunction
} from "express";
import logger from "node-color-log";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";

import { IIndexSignature, IServerConfiguration } from "src/interfaces/index";
import { readConfig } from "../../utils/config";
import { authenticateToken, initSocketManager } from "../../middleware";

import * as socketio from "socket.io"
import http from "http";
import registerGroupEvents from "../../socket/group_events";
import { initSocket } from "../../socket";


type RequestMethod = "get" | "post" | "patch" | "delete";

type RequestType = Request<object, any, any, unknown, Record<string, any>>;
type ResponseType = Response<any, Record<string, any>>;


export class API {
	app: Express;
	config: IServerConfiguration;
	server: http.Server; 
	io: socketio.Server;

	constructor(instance?: Express) {
		if (instance) {
			this.app = instance;
		} else {
			this.app = express();
		}

		this.config = readConfig();
		this.server = http.createServer(this.app); // Создайте HTTP-сервер
		this.io = initSocket(this.server);
		initSocketManager(this.io);

	}



	createRoute(
		path: string | string[], useAuth: boolean,
		callbacks: IIndexSignature<(req: RequestType, res: ResponseType, next: NextFunction) => void>
	) {
		const router: Router = express.Router();

		Object.keys(callbacks).forEach((method: string, index: number) => {
			if (useAuth) {
				router[ method as RequestMethod ]?.(path, authenticateToken, callbacks[ index ])
			}

			router[ method as RequestMethod ]?.(path, callbacks[ index ]);
		});

		this.registerRoute(router);
	}

	registerRoute(route: Router) {
		logger.info("Registering Route.");
		this.app.use(this.config.basePath, route);
		return this;
	}

	registerRoutes(routes: Router[]) {
		routes.forEach((route: Router) => {
			this.registerRoute(route);
		});
		return this;
	}

	registerDefaultPlugins() {
		this.app.use(bodyParser.json());
		this.app.use(morgan("combined"));

		if (this.config.useCors) {
			this.app.use(cors());
		}

		return this;
	}

	
	registerPlugin(plugin: RequestHandler<any, any, any, any, Record<string, any>>[]) {
		logger.log("Registering custom app plugin...");
		this.app.use(plugin);

		return this;
	}

	registerSocketEvents(){
		registerGroupEvents(this.io)
		return this
	}


	listen(callback?: (error?: any) => void) {
		this.server.listen(this.config.port, this.config.host, () => {
			logger.info(`API is listening on ${ this.config.port }.`);
			
		});
	}
}
