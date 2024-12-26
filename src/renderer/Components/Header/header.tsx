import { useDispatch, useSelector } from "react-redux";
import "./header.css"
import { setActivePage, setGroupRole } from "../../Data/Actions/Navigation";
import { logoutUserAsync } from "../../Data/Actions/User";
import { Pages, Roles } from "../../Data/Objects/State";
import { getCurrentPage } from "../../Data/Selectors/Navigation";
import { useState } from "react";
import { IGroupList } from "../../Data/Interfaces";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface HeaderProps {
    GroupHandler: () => void;
    sideNavitems: IGroupList[];
    Request: (e: any) => void;
}

export default function Header({ GroupHandler, sideNavitems, Request }: HeaderProps) {

    const [showDB, setShowDB] = useState(false);

    const dispatch = useDispatch();
    const changeCurrentPage = () => dispatch(setActivePage(Pages.LOGIN));
    const changeCurrentRole = () => dispatch(setCurrentRole(Roles.NONE))
    const attemptLogOutUser = () => dispatch(logoutUserAsync())
    const currentPage = useSelector(getCurrentPage)


    const handleLogOut = () => {
        attemptLogOutUser()
        changeCurrentPage()
    }

    const handleDropBox = () => {
        if (showDB === true) {
            setShowDB(false)
        } else {
            setShowDB(true)
        }
    }

    const setCurrentPage = (page: Pages) => dispatch(setActivePage(page))
    const setCurrentRole = (role: Roles) => dispatch(setGroupRole(role))

    const renderDropBox = (item: any) => {

        const { groupid, name, role } = item

        const composite = ["item", currentPage === name ? "selected" : ""].join('')

        return (
            <div className={composite} key={groupid} onClick={() => { setCurrentPage(name); setShowDB(false); setCurrentRole(role) }}>
                <img className="avatar" src="https://images.pexels.com/photos/2422290/pexels-photo-2422290.jpeg?cs=srgb&dl=pexels-jopwell-2422290.jpg&fm=jpg" />
                <h2> {name} </h2>
            </div>
        )

    }



    return (
        <div className="header">
            <div className="menu-container">
                <div className="menu-trigger" onClick={handleDropBox}>
                    <img className="group-avatar" src="https://avatar.iran.liara.run/public/32" />
                    <p> {currentPage} </p>
                    <KeyboardArrowDownIcon className={showDB ? "rotate-icon" : ""} />
                </div>

                {showDB && <div className="drop-box">
                    <div className="group-list">
                        {sideNavitems.map(renderDropBox)}
                    </div>
                    <form className="invite-form" onSubmit={Request}>
                        <input id="code" className="invite-input" placeholder="Code" />
                        <button className="invite"> Join </button>
                    </form>
                    <hr />
                    <button className="logout" onClick={GroupHandler}> Create Group </button>
                    <hr />
                    <button className="logout" onClick={handleLogOut}> Log out </button>
                </div>}
            </div>

            <h1 style={{ 'cursor': 'pointer' }} onClick={() => setCurrentPage(Pages.HOME)}> AdManager </h1>

            <span style={{ width: '288px' }} />
        </div>
    )
}