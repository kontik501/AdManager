import { useDispatch, useSelector } from "react-redux";
import { AsyncDispatch } from "../../Data/Utills/Redux";
import { setActivePage } from "../../Data/Actions/Navigation";
import { Pages, Roles, UserState } from "../../Data/Objects/State";
import { logoutUserAsync } from "../../Data/Actions/User";
import Header from "../Header/header";
import "./main.css"
import SideNav from "../SideNav/sidenav";
import Content from "../Content/content";
import { useEffect, useState } from "react";
import CreateGroupBox from "../CreateGroup/creategroup";
import { AnimatePresence, motion } from "framer-motion";
import { ICreateGroupPayLoad, IGroupList } from "../../Data/Interfaces";
import { createGroupAsync } from "../../Data/Actions/Group";
import io, { Socket } from 'socket.io-client';
import Settings from "../Settings/settings";
import Members from "../Members/members"
import { getCurrentPage } from "../../Data/Selectors/Navigation";
import store from "../../Data/Objects/Store";
import { Bounce, ToastContainer, toast } from 'react-toastify';
import socket from "../../Data/Utills/socket";
import Home from "./home";
import { getCurrentUser } from "../../Data/Selectors/User";

interface Rooms {
    name: string
}


export default function MainPage({ User }: any) {
    const [showCG, setShowCG] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [sideNavitems, setSideNavItems] = useState<IGroupList[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Rooms | null>(null);


    const [invite, setInvite] = useState("");


    const currentPage = useSelector(getCurrentPage)
    const currentUser = useSelector(getCurrentUser)
    const setCurrentPage = (page: Pages) => dispatch(setActivePage(page))

    useEffect(() => {

        socket.connect()

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('authenticate', { token: User.email });

        });

        socket.on('SendGroups', (fetchedData: any) => {
            setSideNavItems(fetchedData);
        });

        socket.on('Group-update', (fetchedData: any) => {
            if (fetchedData.previousName === store.getState().Navigation.currentPage) {
                setCurrentPage(fetchedData.updatedName)
            }
            socket.emit('RequestUpdate')
        })

        socket.on('update', () => {
            socket.emit('RequestUpdate')
        })


        return () => {
            socket.disconnect();
        }
    }, [])

    useEffect(() => {
        setSelectedRoom(null)
    }, [currentPage])

    const dispatch: AsyncDispatch = useDispatch();
    const attemptCreateGroup = (payload: ICreateGroupPayLoad) => dispatch(createGroupAsync(payload));

    const handleCreateGroup = () => {
        if (showCG === true) {
            setShowCG(false)
        } else {
            setShowCG(true)
        }
    }

    const handleSettings = () => {
        if (store.getState().Navigation.groupRole !== Roles.OWNER) {
            toast.error("Access Denied", {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
                transition: Bounce,
            });
        } else {
            if (showSettings === true) {
                setShowSettings(false)
            } else {
                setShowSettings(true)

                socket.emit("Request-group-settings", { token: currentPage }, (response: any) => {
                    setInvite(response[0].invite)
                })
            }
        }
    }

    const changeInviteCode = () => {
        socket.emit("Change-invite-code", { token: currentPage }, (response: any) => {
            setInvite(response[0].invite)
        })
    }

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const name = e?.target?.name?.value;
        const email = User.email
        attemptCreateGroup({ name, email }).then(() => {
            setShowCG(false)
        })
    }

    const handleSaveChanges = (e: any) => {
        e.preventDefault();
        const name = e?.target?.name?.value;
        socket.emit('Change-Name', { token: name, page: currentPage })
        setShowSettings(false)
    }

    const deleteGroup = () => {
        socket.emit('DeleteGroup', { token: currentPage })
        setCurrentPage(Pages.HOME)
        setShowSettings(false)
    }

    const sendRequest = (e: any) => {
        e.preventDefault();
        const code = e?.target?.code?.value
        const email = User.email
        socket.emit('send-request', { code: code, email: email }, (response: any) => {
            if (response.type === "error") {
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
                });
            } else {
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
            }

        })
    }

    const handleMembers = () => {
        if (showMembers === true) {
            setShowMembers(false)
        } else {
            setShowMembers(true)

        }
    }

    const handleRoomSelect = (room: any) => {
        setSelectedRoom(room);
    };


    return (
        <div>
            <AnimatePresence>
                <div>
                    <Header GroupHandler={handleCreateGroup} sideNavitems={sideNavitems} Request={sendRequest} />
                    <div className="under-header">
                        <AnimatePresence>
                            {currentPage != Pages.HOME && <SideNav settingsHandler={handleSettings} membersHandler={handleMembers} roomHandler={handleRoomSelect} roomSelector={selectedRoom} />}
                            {currentPage === Pages.HOME && <Home user={currentUser} />}
                        </AnimatePresence>
                        {selectedRoom && <Content roomSelector={selectedRoom} />}
                    </div>
                </div>

                {showCG && <CreateGroupBox Close={handleCreateGroup} Submit={handleSubmit} />}
                {showSettings && <Settings Close={handleSettings} invite={invite} changeFcn={changeInviteCode} saveSettings={handleSaveChanges} Delete={deleteGroup} />}
                {showMembers && <Members Close={handleMembers} />}
            </AnimatePresence>
            <ToastContainer />
        </div>
    )
}