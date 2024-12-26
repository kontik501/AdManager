import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { emitToUser, generateAccessToken, generateInviteCode } from "../middleware/index";
import { readConfig } from "../utils/config";
import pool, * as db from '../utils/database'
import * as socketio from "socket.io"
import { getSocket } from "../socket";

export const groupRouter = express.Router();
const config = readConfig();

groupRouter.post("/creategroup", async (req, res) => {

        const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query('SELECT id FROM public."user" WHERE email = $1', [req.body.email]);
        if (userResult.rows.length === 0) {
        throw new Error('User not found');
        }
        const userId = userResult.rows[0].id;

        const invite = generateInviteCode(6)

        await client.query('INSERT INTO public."groups" (name,invite) VALUES ($1, $2)', [req.body.name, invite]);

        const groupResult = await client.query('SELECT groupid FROM public."groups" WHERE name = $1', [req.body.name]);
        if (groupResult.rows.length === 0) {
        throw new Error('Group not found');
        }
        const groupId = groupResult.rows[0].groupid;

        const roleResult = await client.query('SELECT roleid FROM public.roles WHERE role = $1', ["Owner"]);
        if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
        }
        
        const roleId = roleResult.rows[0].roleid;

        await client.query('INSERT INTO public.members (groupid, userid, role) VALUES ($1, $2, $3)', [groupId, userId, roleId]);

        await client.query('COMMIT');

        const updatedData = await db.query('SELECT members.groupid, groups.name, roles.role  FROM public."members" INNER JOIN public."groups" ON members.groupid = groups.groupid INNER JOIN public."roles" ON members.role = roles.roleid WHERE members.userid = $1', [userId])
        emitToUser(userId, "SendGroups", updatedData.rows)


        res.status(200).json({
            message: "Group created succesfully",
             }
        );
    } catch (error:any) {
        await client.query('ROLLBACK');
        console.log(error)
        res.status(400).json({
            message: error.message
             }
        );
    } finally {
        client.release();
    }
	
});