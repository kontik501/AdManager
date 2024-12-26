import * as socketio from "socket.io";
import { addSocket, removeSocket } from "../middleware/index";
import {
  authenticateHandler,
  requestGroupSettingsHandler,
  changeInviteCodeHandler,
  changeNameHandler,
  requestUpdateHandler,
  deleteGroupHandler,
  sendRequestHandler,
  requestMembersHandler,
  handleRequest,
  deleteUserByEmail,
  requestRoomsByGroupName,
  createRoom,
  requestUserGroups,
  deleteRoom,
  createTask,
  handleTaskRequest,
  DeleteTask,
  updateStatus,
  updateProject,
  handleRequestProject,
  saveLink,
  links
} from './group_handlers';

export default function registerGroupEvents(io: socketio.Server) {
  io.on("connection", (socket: socketio.Socket) => {

    socket.on('authenticate', async ({ token }) => {
      await authenticateHandler(socket, io, token);
    });

    socket.on('request-groups', async () => {
      await requestUserGroups(socket);
    })

    socket.on("Request-group-settings", async ({ token }, callback) => {
      await requestGroupSettingsHandler(socket, token, callback);
    });

    socket.on("Change-invite-code", async ({ token }, callback) => {
      await changeInviteCodeHandler(socket, token, callback);
    });

    socket.on('Change-Name', async ({ token, page }) => {
      await changeNameHandler(socket, io, token, page);
    });

    socket.on('RequestUpdate', async () => {
      await requestUpdateHandler(socket);
    });

    socket.on('DeleteGroup', async ({ token }) => {
      await deleteGroupHandler(socket, io, token);
    });

    socket.on('send-request', async ({ code, email }, callback) => {
      await sendRequestHandler(socket, code, email, callback);
    });

    socket.on('request-members', async ({ token, user, role }) => {
      await requestMembersHandler(token, user, role, io, socket);
    })
    socket.on('handleRequest', async ({ email, action, group }, callback) => {
      await handleRequest(email, action, group, socket, io, callback);
    })

    socket.on('delete-user', async ({ email, group }) => {
      await deleteUserByEmail(email, group, io)
    })

    socket.on('request-rooms', async ({ group }) => {
      await requestRoomsByGroupName(group, socket)
    })

    socket.on('create-room', async ({ group, name }) => {
      await createRoom(group, name, io, socket);
    })

    socket.on('delete-room', async ({ name, group }) => {
      await deleteRoom(group, name, io, socket);
    })

    socket.on('request-tasks', async({room, group})=>{
      await handleTaskRequest(room, group, socket);
    })

    socket.on('create-task', async({user, selecteduser, textarea, room, deadline}) =>{
      await createTask(user, selecteduser, textarea, room, deadline, socket, io);
    })

    socket.on('delete-task', async({taskid, roomid}) =>{
      await DeleteTask(roomid, taskid, socket, io);
    })

    socket.on('update-task-status',async({taskid, status, group, user, source}, callback)=>{
      await updateStatus(taskid, status, group,user, source, callback, socket, io)
    })

    socket.on('update-project',async({room, group, name, description, goal, budget, KPI, add_goals, customer_name, number, inst, fb, tg})=>{
      await updateProject(room, group, name, description, goal, budget, KPI, add_goals, customer_name, number, inst, fb, tg, socket, io);
    })

    socket.on('request-project',async({room, group})=>{
      await handleRequestProject(room, group, socket, io);
    })
    socket.on('saveLink',async({room, link, code})=>{
      console.log("IM HERE")
      await saveLink(room, link, code, socket, io);
    })
    socket.on('links',async({room, group},callback)=>{
      await links(room, group, callback, socket, io);
    })




    socket.on("disconnect", () => {
      removeSocket(socket.id);
    });

  });
}