import { useEffect, useState } from "react"
import "./sidenav.css"
import { useDispatch, useSelector } from "react-redux";
import { Pages, Roles } from "../../Data/Objects/State";
import { setActivePage } from "../../Data/Actions/Navigation";
import { getCurrentPage } from "../../Data/Selectors/Navigation";
import store from "../../Data/Objects/Store";
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import socket from "../../Data/Utills/socket";
import CreateRoom from "../CreateRoom/createroom";
import CloseIcon from '@mui/icons-material/Close';
import { motion } from "framer-motion";

interface Rooms {
    name: string
}

interface SideNavProps {
    settingsHandler: () => void;
    membersHandler: () => void;
    roomHandler: (room: any) => void;
    roomSelector: Rooms | null;
}


export default function SideNav({ settingsHandler, membersHandler, roomHandler, roomSelector }: SideNavProps) {

    const dispatch = useDispatch()
    const currentPage = useSelector(getCurrentPage)
    const setCurrentPage = (page: Pages) => dispatch(setActivePage(page))
    const [rooms, setRooms] = useState<Rooms[]>([]);
    const [showCreateRoom, setshowCreateRoom] = useState(false);


    const handleCreateRoom = () => {
        if (showCreateRoom === true) {
            setshowCreateRoom(false)
        } else {
            setshowCreateRoom(true)
        }
    }

    useEffect(() => {
        if (currentPage !== Pages.HOME && currentPage !== Pages.LOGIN) {
            socket.emit('request-rooms', { group: currentPage })



            socket.on('recieveRooms', (data: any) => {
                setRooms(data)
            })

            socket.on('updateRooms', () => {
                console.log("TESTING")
                socket.emit('request-rooms', { group: currentPage })
            })
        } else {
            socket.off('recieveRooms');
            socket.off('updateRooms');
            setRooms([]);
        }
    }, [currentPage])

    const createRoom = (e: any) => {
        e.preventDefault();
        const name = e?.target?.name?.value
        socket.emit('create-room', { group: currentPage, name: name })
        setshowCreateRoom(false)
    }

    const deleteRoom = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        socket.emit('delete-room', { name: name, group: currentPage });
    };

    const renderRooms = (item: any) => {

        const { name } = item

        const isSelected = roomSelector?.name === name;


        return (
            <div key={name}
                className={`room ${isSelected && roomSelector?.name === item.name ? 'selected' : ''}`}
                onClick={() => roomHandler(item)}>
                <p> {item.name} </p>
                <div className="delete-room" onClick={(e) => deleteRoom(item.name, e)}>
                    <CloseIcon />
                </div>
            </div>
        )
    }



    return (
        <motion.div
            className="sidenav"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ stiffness: 120, duration: 0.5 }}>


            {store.getState().Navigation.currentPage !== Pages.HOME && <div className="sidenav-items">
                <div className="settings" onClick={() => settingsHandler()}>
                    <SettingsIcon />
                    <h3> Settings </h3>
                </div>
                <div className="settings" onClick={() => membersHandler()}>
                    <GroupsIcon />
                    <h3> Members </h3>
                </div>
                <div className={`settings ${roomSelector?.name === 'Statistic' ? 'selected' : ''}`} onClick={() => roomHandler({ name: "Statistic" })}>
                    <BarChartIcon />
                    <h3> Statistic </h3>
                </div>
                <hr />

            </div>}

            <div className="sideRooms">

                {rooms.map(renderRooms)}

                {store.getState().Navigation.groupRole !== Roles.OWNER || Roles.ADMIN && currentPage !== Pages.HOME &&
                    <div className="createNewRoom" onClick={handleCreateRoom} >
                        <p> Create New Room </p>
                    </div>
                }

                {showCreateRoom && <CreateRoom Close={handleCreateRoom} Submit={createRoom} />}

            </div>

        </motion.div>
    )
}