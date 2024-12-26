import express from "express";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../middleware/index";
import { readConfig } from "../utils/config";
import * as db from '../utils/database'

export const userRouter = express.Router();
const config = readConfig();

userRouter.post("/register", async (req, res) => {
	
	if ((req.body.email as string).length > 70) {
		res.status(400).json({ message: "Character limit must be 70 or less" });
	}

	let tempIfUserExist = await db.query('SELECT * FROM public."user" WHERE email = $1', [req.body.email as string])
	if(tempIfUserExist.rowCount == 0){
		try {
			const hash = await bcrypt.hash(req.body.password, config.passwordSalt);

			await db.query('INSERT INTO public."user" (email, firstname, secondname, password) VALUES ( $1,$2,$3,$4 )', [req.body.email, req.body.firstname, req.body.secondname, hash])
			console.log("Sucessfuly added a new user")
	
			const token = generateAccessToken(await db.query('SELECT id FROM public."user" WHERE email = $1',[req.body.email]));
			res.status(200).json(
				{
					token,
					user: { 
						email: req.body.email,
						firstname: req.body.firstname,
						secondname: req.body.secondname
					 }
				}
			);
		}
		catch(error: any) {
			res.status(400).json({ message: error.message });
		}
	}
});

userRouter.post("/login", async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	const selecteduser = await db.query('SELECT * FROM public."user" WHERE email = $1', [req.body.email as string])

	if (selecteduser.rowCount === 0) {
		res.status(400).json({ error: "Invalid Email" });
	} else {
		if (selecteduser) {
			const isValid = await bcrypt.compare(password, selecteduser.rows[0].password);
		
				if (isValid) {
					const token = generateAccessToken(selecteduser.rows[0].username);
					res.status(200).json({
						token,
						user: { 
							email: selecteduser.rows[0].email,
							firstname: selecteduser.rows[0].firstname,
							secondname: selecteduser.rows[0].secondname
						 }
					});
				} else {
					res.status(400).json({ error: "Invalid Password" });
				}
			}
	}
});