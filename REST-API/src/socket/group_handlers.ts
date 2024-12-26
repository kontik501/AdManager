import * as db from '../utils/database';
import { addSocket, emitToUser, generateInviteCode, getSocketByUserId, getSocketIdsByUserId } from "../middleware/index";
import * as socketio from "socket.io";

export async function authenticateHandler(socket, io, token) {
  try {
    const userResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [token]);
    const userId = userResult.rows[0].id;

    addSocket(userId, socket.id);

    socket.data.userId = userId;
    console.log("User authenticated with ID:", socket.data.userId);

    const requestedData = await db.query('SELECT members.groupid, groups.name, roles.role FROM public."members" INNER JOIN public."groups" ON members.groupid = groups.groupid INNER JOIN public."roles" ON members.role = roles.roleid WHERE members.userid = $1', [socket.data.userId]);
    socket.emit('SendGroups', requestedData.rows);
  } catch (error) {
    console.error("Error during authentication:", error);
    socket.emit('error', 'Authentication failed');
  }
}

export async function requestUserGroups(socket) {
  try {
    const requestedData = await db.query('SELECT members.groupid, groups.name, roles.role FROM public."members" INNER JOIN public."groups" ON members.groupid = groups.groupid INNER JOIN public."roles" ON members.role = roles.roleid WHERE members.userid = $1', [socket.data.userId]);
    socket.emit('SendGroups', requestedData.rows);
  } catch (error) {
    console.error("Error requesting user groups:", error);
    socket.emit('error', 'Failed to retrieve user groups');
  }
}

export async function requestGroupSettingsHandler(socket, token, callback) {
  try {
    const inviteCode = await db.query('SELECT invite FROM public."groups" WHERE name = $1', [token]);
    callback(inviteCode.rows);
  } catch (error) {
    console.error("Error requesting group settings:", error);
    callback([]);
  }
}

export async function changeInviteCodeHandler(socket, token, callback) {
  try {
    const invite = generateInviteCode(6);
    await db.query('UPDATE public."groups" SET invite = $1 WHERE name = $2', [invite, token]);
    const inviteCode = await db.query('SELECT invite FROM public."groups" WHERE name = $1', [token]);
    callback(inviteCode.rows);
  } catch (error) {
    console.error("Error changing invite code:", error);
    callback([]);
  }
}

export async function changeNameHandler(socket, io, token, page) {
  try {
    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [page]);
    await db.query('UPDATE public."groups" SET name = $1 WHERE name = $2', [token, page]);
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupResult.rows[0].groupid]);

    const updateData = {
      changeType: "nameChanged",
      updatedName: token,
      previousName: page,
    };

    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("Group-update", updateData);
    });
  } catch (error) {
    console.error("Error changing group name:", error);
    socket.emit('error', 'Failed to change group name');
  }
}

export async function requestUpdateHandler(socket) {
  try {
    const requestedData = await db.query('SELECT members.groupid, groups.name, roles.role FROM public."members" INNER JOIN public."groups" ON members.groupid = groups.groupid INNER JOIN public."roles" ON members.role = roles.roleid WHERE members.userid = $1', [socket.data.userId]);
    socket.emit('SendGroups', requestedData.rows);
  } catch (error) {
    console.error("Error requesting update:", error);
    socket.emit('error', 'Failed to retrieve update');
  }
}

export async function deleteGroupHandler(socket, io, token) {
  try {
    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [token]);
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupResult.rows[0].groupid]);
    await db.query('DELETE FROM public.groups WHERE name = $1', [token]);

    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    const updateData = {
      changeType: "groupDeleted",
      updatedName: "HOME",
      previousName: token,
    };

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("Group-update", updateData);
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    socket.emit('error', 'Failed to delete group');
  }
}

export async function sendRequestHandler(socket, code, email, callback) {
  try {
    const userResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [email]);
    const userId = userResult.rows[0].id;

    const groupId = await db.query('SELECT groupid FROM public."groups" WHERE invite = $1', [code]);
    if (groupId.rows.length === 0) {
      callback({ message: "Group not found", type: "error" });
    } else {
      const checkMembers = await db.query('SELECT * FROM public."members" WHERE userid = $1 AND groupid = $2', [userId, groupId.rows[0].groupid]);
      if (checkMembers.rows.length !== 0) {
        callback({ message: "User already in this group", type: "error" });
      } else {
        await db.query('INSERT INTO public."requests" (groupid, userid) VALUES ($1, $2)', [groupId.rows[0].groupid, userId]);
        callback({ message: "Request sent successfully", type: "success" });
      }
    }
  } catch (error) {
    console.error("Error sending request:", error);
    callback({ message: "Failed to send request", type: "error" });
  }
}

export async function requestMembersHandler(token, user, role, io, socket) {
  try {
    const requestedInfo = await db.query('SELECT (u.email, u.firstname, u.secondname, r.role) FROM public."groups" g INNER JOIN public."members" m ON g.groupid = m.groupid INNER JOIN public."roles" r ON m.role = r.roleid INNER JOIN public."user" u ON m.userid = u.id WHERE g.name = $1', [token]);
    const users = await db.query('SELECT m.userid FROM public."members" m INNER JOIN public."groups" g ON m.groupid = g.groupid WHERE g.name = $1', [token]);

    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    const parsedResponse = requestedInfo.rows.map((item) => {
      const [email, firstname, secondname, role] = item.row.slice(1, -1).split(',');
      return { email, firstname, secondname, role };
    });

    socket.emit("members", parsedResponse);

    if (role === "Owner") {
      const groupId = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [token]);
      const requests = await db.query('SELECT u.email, u.firstname, u.secondname FROM public."user" u INNER JOIN public."requests" r ON u.id = r.userid WHERE r.groupid = $1', [groupId.rows[0].groupid]);
      socket.emit("get-requests", requests.rows);
    }
  } catch (error) {
    console.error("Error requesting members:", error);
    socket.emit('error', 'Failed to retrieve members');
  }
}

export async function handleRequest(email, action, group, socket, io, callback) {
  try {
    const userResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [email]);
    const userId = userResult.rows[0].id;

    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    if (action === "accept") {
      await db.query('INSERT INTO public."members" (groupid, userid, role) VALUES ($1, $2, $3)', [groupId, userId, 3]);
      await db.query('DELETE FROM public."requests" WHERE userid = $1 AND groupid = $2', [userId, groupId]);

      const requests = await db.query('SELECT u.email, u.firstname, u.secondname FROM public."user" u INNER JOIN public."requests" r ON u.id = r.userid WHERE r.groupid = $1', [groupId]);
      socket.emit("get-requests", requests.rows);

      callback({ message: "Added user to members", type: "success" });
      io.to(getSocketByUserId(userId)).emit('update');
    } else {
      await db.query('DELETE FROM public."requests" WHERE userid = $1 AND groupid = $2', [userId, groupId]);
      const requests = await db.query('SELECT u.email, u.firstname, u.secondname FROM public."user" u INNER JOIN public."requests" r ON u.id = r.userid WHERE r.groupid = $1', [groupId]);
      socket.emit("get-requests", requests.rows);
      callback({ message: "Request Declined", type: "decline" });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    callback({ message: "Failed to handle request", type: "error" });
  }
}

export async function deleteUserByEmail(email, group, io) {
  try {
    const userResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [email]);
    const userId = userResult.rows[0].id;

    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    await db.query('DELETE FROM public."members" WHERE userid = $1 AND groupid = $2', [userId, groupId]);

    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    io.to(getSocketByUserId(userId)).emit('update');

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("update-members");
    });
  } catch (error) {
    console.error("Error deleting user by email:", error);
    io.emit('error', 'Failed to delete user');
  }
}

export async function requestRoomsByGroupName(group, socket) {
  try {
    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    const roomsResult = await db.query('SELECT name FROM public."rooms" WHERE groupid = $1', [groupId]);
    socket.emit('recieveRooms', roomsResult.rows);
  } catch (error) {
    console.error("Error requesting rooms by group name:", error);
    socket.emit('error', 'Failed to retrieve rooms');
  }
}

export async function createRoom(group, name, io, socket) {
  try {
    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    await db.query('INSERT INTO public."rooms" (groupid, name) VALUES ($1, $2)', [groupId, name]);

    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("updateRooms");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("updateRooms");
      });
    }
  } catch (error) {
    console.error("Error creating room:", error);
    socket.emit('error', 'Failed to create room');
  }
}

export async function deleteRoom(group, name, io, socket) {
  try {
    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    await db.query('DELETE FROM public."rooms" WHERE name = $1 AND groupid = $2', [name, groupId]);

    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("updateRooms");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("updateRooms");
      });
    }

  } catch (error) {
    console.error("Error deliting room:", error);
    socket.emit('error', 'Failed to delete room');
  }
}

export async function createTask(user, selecteduser, textarea, room, deadline, socket, io) {

  console.log(user)

  try {
    let choosen = null
    if (selecteduser != '') {
      const selecteduserResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [selecteduser]);
      const selecteduserId = selecteduserResult.rows[0].id;
      choosen = selecteduserId
    }

    const roomsResult = await db.query('SELECT roomid FROM public."rooms" WHERE name = $1', [room.name]);
    const roomId = roomsResult.rows[0].roomid;

    const userResult = await db.query('SELECT id FROM public."user" WHERE email = $1', [user]);
    const userId = userResult.rows[0].id;


    await db.query('INSERT INTO public."tasks" (roomid, description, status, assigned_by, assigned_to, deadline) VALUES ($1,$2,$3,$4,$5,$6)', [roomId, textarea, 'Todo', userId, choosen, deadline])

    const groupResult = await db.query('SELECT groupid FROM public."rooms" WHERE roomid = $1', [roomId])
    const groupId = groupResult.rows[0].groupid;
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("update-tasks");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-tasks");
      });
    }

  } catch (error) {
    console.log("Error:", error)
    socket.emit('error', 'Failed to create task');
  }
}

export async function handleTaskRequest(room, group, socket) {
  try {

    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupResult.rows[0].groupid;

    if (room === 'All') {
      const return_by = groupId

      const tasksResult = await db.query(`SELECT 
    t.*,
    u1.firstname AS assigned_by_firstname,
    u1.secondname AS assigned_by_secondname,
    u2.firstname AS assigned_to_firstname,
    u2.secondname AS assigned_to_secondname,
    u3.firstname AS taken_by_firstname,
    u3.secondname AS taken_by_secondname
 FROM 
    public.tasks t
 LEFT JOIN 
    public.user u1 ON t.assigned_by = u1.id
 LEFT JOIN 
    public.user u2 ON t.assigned_to = u2.id
 LEFT JOIN 
    public.user u3 ON t.taken_by = u3.id
  INNER JOIN
      public.rooms r ON t.roomid = r.roomid
  INNER JOIN
      public.groups g ON r.groupid = g.groupid
 WHERE 
    g.groupid = $1`,
        [groupId]
      );

      socket.emit('recieve-tasks', { tasksResult })




    } else {
      const roomsResult = await db.query('SELECT roomid FROM public."rooms" WHERE name = $1 AND groupid = $2', [room.name, groupId]);
      const roomId = roomsResult.rows[0].roomid;
      const return_by = roomId

      const tasksResult = await db.query(`SELECT 
    t.*,
    u1.firstname AS assigned_by_firstname,
    u1.secondname AS assigned_by_secondname,
    u2.firstname AS assigned_to_firstname,
    u2.secondname AS assigned_to_secondname,
    u3.firstname AS taken_by_firstname,
    u3.secondname AS taken_by_secondname
 FROM 
    public.tasks t
 LEFT JOIN 
    public.user u1 ON t.assigned_by = u1.id
 LEFT JOIN 
    public.user u2 ON t.assigned_to = u2.id
 LEFT JOIN 
    public.user u3 ON t.taken_by = u3.id
 WHERE 
    t.roomid = $1`,
        [roomId]
      );

      socket.emit('recieve-tasks', { tasksResult })
    }




  } catch (error) {
    console.log("Error:", error)
    socket.emit('error', 'Failed to send tasks');
  }
}

export async function DeleteTask(roomid, taskid, socket, io) {
  try {

    await db.query(`DELETE FROM public."tasks" WHERE taskid = $1 AND roomid = $2`, [taskid, roomid])

    const groupResult = await db.query('SELECT groupid FROM public."rooms" WHERE roomid = $1', [roomid])
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupResult.rows[0].groupid]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("update-tasks");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-tasks");
      });
    }

  } catch (error) {
    console.log("Error:", error)
    socket.emit('error', 'Failed to delete tasks');
  }
}

export async function updateProject(room, group, name, description, goal, budget, KPI, add_goals, customer_name, number, inst, fb, tg, socket, io) {
  try{

    const groupIdResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
    const groupId = groupIdResult.rows[0].groupid;
    const roomIdResult = await db.query('SELECT roomid FROM public."rooms" WHERE name = $1 AND groupid = $2', [room.name, groupId]);
    const roomId = roomIdResult.rows[0].roomid;

    await db.query('UPDATE public."rooms" SET projectname = $2, projectdesc = $3, goal = $4, budget = $5, KPI = $6, addgoals = $7 WHERE roomid = $1', [roomId, name,description,goal,budget,KPI,add_goals])
    const customerIdResult = await db.query('SELECT customerid FROM public."rooms" WHERE roomid = $1', [roomId])
    const customerId = customerIdResult.rows[0].customerid;

    await db.query('UPDATE public."customer" SET name = $1, phone = $2, instagram = $3, facebook = $4, telegram = $5 WHERE customerid = $6', [customer_name, number, inst, fb, tg, customerId])
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("project-update-request");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("project-update-request");
      });
    }

  }catch(error){
    console.log('Error:', error)
    socket.emit('error','Failed to update project')
  }
}

export async function handleRequestProject(room, group, socket, io) {

  const groupIdResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
  const groupId = groupIdResult.rows[0].groupid;

  const infoResult = await db.query("SELECT rooms.*, customer.name AS customer_name, customer.phone AS customer_phone, customer.instagram AS customer_instagram, customer.facebook AS customer_facebook, customer.telegram AS customer_telegram FROM public.rooms JOIN public.customer ON rooms.customerid = customer.customerid WHERE rooms.name = $1 AND rooms.groupid = $2", [room.name, groupId])

  socket.emit('recieve-project', {infoResult} )

}

export async function saveLink(room, link, code, socket, io) {
  const roomIdResult = await db.query('SELECT roomid FROM public."rooms" WHERE name = $1', [room.name]);
  const roomId = roomIdResult.rows[0].roomid;
  let massage = '';

  switch(code){
    case 'API':
      await db.query('UPDATE public."figma" SET figmaAPI = $1 WHERE figmaid = $2', [link, roomId])
      massage = 'FigmaApiUpdate';
      break;
    case 'Design':
      await db.query('UPDATE public."figma" SET figmalink = $1 WHERE figmaid = $2', [link, roomId])
      massage = 'FigmaLinkUpdate';
      break;
    case 'Strategy':
      await db.query('UPDATE public."figma" SET figmajamlink = $1 WHERE figmaid = $2', [link, roomId])
      massage = 'FigmaJamUpdate';
      break;
  }

  const groupIdResult = await db.query('SELECT groupid FROM public."rooms" WHERE roomid = $1', [roomId]);
  const groupId = groupIdResult.rows[0].groupid;

  const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupId]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
        io.to(socketIds[0]).emit("update-links", {massage, link});
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-links", {massage, link});
      });
    }
}

export async function links(room, group, callback, socket, io) {
  const groupIdResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group]);
  const groupId = groupIdResult.rows[0].groupid;

  const roomIdResult = await db.query('SELECT roomid FROM public."rooms" WHERE name = $1 AND groupID = $2', [room.name, groupId]);
  const roomId = roomIdResult.rows[0].roomid;

  const request = await db.query('SELECT * FROM public."figma" WHERE figmaid = $1', [roomId])
  callback({request})
}

export async function updateStatus(taskid, status, group, user, source, callback, socket, io) {
  const assigned_to = await db.query('SELECT u.email, t.assigned_to FROM public."user" u INNER JOIN public."tasks" t ON u.id = t.assigned_to WHERE t.taskid = $1', [taskid])
  if (assigned_to?.rows[0]?.assigned_to === undefined || user.email === assigned_to?.rows[0]?.email) {

    if (source === 'Todo') {
      if (status === 'In Progress') {

        const taken_by = await db.query('SELECT id FROM public."user" WHERE email = $1', [user.email])
        await db.query('UPDATE public."tasks" SET status = $1, taken_by = $2, taken_at = NOW() WHERE taskid = $3', [status, taken_by.rows[0].id, taskid])


      } else if (status === 'Needs Review') {
        callback({ message: "Bad action", type: "error" });
      } else if (status === 'Completed') {
        callback({ message: "Bad action", type: "error" });
      }
    }

    if (source === 'In Progress') {
      if (status === 'Todo') {
        await db.query('UPDATE public."tasks" SET status = $1, taken_by = $2 WHERE taskid = $3', [status, null, taskid])
      } else if (status === 'Needs Review') {
        await db.query('UPDATE public."tasks" SET status = $1, needs_review_at = NOW() WHERE taskid = $2', [status, taskid])
      } else if (status === 'Completed') {
        await db.query('UPDATE public."tasks" SET status = $1, completed_at = NOW() WHERE taskid = $2', [status, taskid])
      }
    }

    if (source === 'Needs Review') {
      if (status === 'Todo') {
        callback({ message: "Bad action", type: "error" });
      } else if (status === 'In Progress') {
        await db.query('UPDATE public."tasks" SET status = $1, needs_review_at = $2 WHERE taskid = $3', [status, null, taskid])
      } else if (status === 'Completed') {
        await db.query('UPDATE public."tasks" SET status = $1, completed_at = NOW() WHERE taskid = $2', [status, taskid])
      }
    }

    if (source === 'Completed') {
      callback({ message: "Bad action", type: "error" });
    }

    const groupResult = await db.query('SELECT groupid FROM public."groups" WHERE name = $1', [group])
    const users = await db.query('SELECT userid FROM public."members" WHERE groupid = $1', [groupResult.rows[0].groupid]);
    const userIds = users.rows.map((obj) => obj.userid);
    const socketIds = getSocketIdsByUserId(userIds);

    if (socketIds.length === 1) {
      io.to(socketIds[0]).emit("update-tasks");
    } else {
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-tasks");
      });
    }


  } else {
    callback({ message: "Access Denied", type: "error" });
  }


}