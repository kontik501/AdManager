import "./members.css"
import { useSelector } from "react-redux";
import { motion } from 'framer-motion';
import { getCurrentPage, getCurrentRole } from "../../Data/Selectors/Navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../Data/Selectors/User";
import { Bounce, toast } from "react-toastify";
import CloseIcon from '@mui/icons-material/Close';
import store from "../../Data/Objects/Store";
import { Roles } from "../../Data/Objects/State";
import socket from "../../Data/Utills/socket";


interface MembersProps {
  Close: () => void;
}
interface Member {
  email: string;
  firstname: string;
  secondname: string;
  role: string;
}
interface Requests {
  email: string;
  firstname: string;
  secondname: string;
}

const Members = ({ Close }: MembersProps) => {

  const [showTab, setCurrentTab] = useState("Members");
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<Requests[]>([]);
  const roleOrder: { [key: string]: number } = {
    Owner: 1,
    Admin: 2,
    Member: 3,
    Participant: 4,
  };

  const currentUser = useSelector(getCurrentUser)

  const groupRole = useSelector(getCurrentRole)

  const groupName = useSelector(getCurrentPage)

  useEffect(() => {

    socket.emit("request-members", { token: groupName, user: currentUser, role: groupRole })

    socket.on('members', (data: any) => {
      const sortedMembers = data.sort((a: any, b: any) => roleOrder[a.role] - roleOrder[b.role]);
      setMembers(sortedMembers);
    })

    socket.on('get-requests', (data: any) => {
      setRequests(data);
    })

    socket.on('update-members', () => {
      socket.emit("request-members", { token: groupName, user: currentUser, role: groupRole })
    })

    return () => {
      socket.off('members');
      socket.off('get-requests')
    };
  }, [])


  const renderList = (item: any) => {

    const { email, firstname, secondname, role } = item

    const username = firstname + " " + secondname[0] + "."

    const accessLevel = (item: any) => {
      if (store.getState().Navigation.groupRole !== Roles.OWNER) {

      }
    }

    return (
      <tr key={item.email} className="memberItem">
        <td>{item.email}</td>
        <td>{username}</td>
        <td>{item.role}</td>

        {store.getState().Navigation.groupRole == Roles.OWNER && item.role !== "Owner" &&
          <div className="delete-user" onClick={() => deleteUser(item.email)}>
            <CloseIcon />
          </div>}
      </tr>
    )
  }

  const deleteUser = (email: any) => {
    socket.emit('delete-user', { email: email, group: groupName })
  }

  const handleRequest = (email: any, action: any) => {
    socket.emit('handleRequest', { email: email, action: action, group: groupName }, (response: any) => {
      if (response.type === "success") {
        socket.emit("request-members", { token: groupName, user: currentUser, role: groupRole })
        toast.success(response.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        });
      } else (
        toast.error(response.message, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        })
      )
    })
  }

  const renderRequests = (item: any) => {
    const { email, firstname, secondname } = item

    return (
      <div key={item.email + "_request"} className="requestItem">
        <img className="avatar" src="https://avatar.iran.liara.run/public/32" />
        <div className="request-name">
          <h2> {item.email} </h2>
          <p> {item.firstname + "  " + item.secondname} </p>
        </div>
        <button className="request-btn acc" onClick={() => handleRequest(item.email, "accept")}> Accept </button>
        <button className="request-btn dec" onClick={() => handleRequest(item.email, "decline")}> Decline </button>
      </div>
    )
  }


  return (
    <motion.div className="popup-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>


      <div className="members-popup">
        <button className='close-btn' onClick={Close}></button>
        <div className="members">
          <div className="members-tab">
            <div className={`tab ${showTab === "Members" ? "active" : ""}`} onClick={() => setCurrentTab("Members")}> <p> Members </p> </div>
            {store.getState().Navigation.groupRole !== Roles.OWNER || Roles.ADMIN && <div className={`tab ${showTab === "Requests" ? "active" : ""}`} onClick={() => setCurrentTab("Requests")}> <p> Requests <span style={{ 'color': '#dd0000' }}> {requests.length > 0 && `(${requests.length})`} </span> </p> </div>}
          </div>


          {showTab === "Members" &&                       // MEMBERS TAB
            <table className="members-list">
              <thead>
                <tr>
                  <th style={{ 'width': '40%' }}>Email</th>
                  <th style={{ 'width': '30%' }}>Name</th>
                  <th style={{ 'width': '30%' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map(renderList)}
              </tbody>
            </table>}


          {showTab === "Requests" &&      // REQUESTS TAB
            <div className="requests">
              {requests.map(renderRequests)}
            </div>
          }

        </div>

      </div>

    </motion.div>
  );
};

export default Members;