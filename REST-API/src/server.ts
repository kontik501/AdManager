import { userRouter, testRouter, fileRouter, groupRouter } from "../src/routes/index";
import { API } from "../src/objects/index";

const api = new API()
	.registerDefaultPlugins()
	.registerRoutes([ userRouter, testRouter, fileRouter, groupRouter ])
	.registerSocketEvents()
	.listen((error) => {
		if (error) {
			throw new Error(error);
		}
	});




	