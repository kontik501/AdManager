import './LinkAPI.css';
import { motion } from 'framer-motion';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useState } from 'react';
import Textarea from '@mui/joy/Textarea';
import socket from '../../../../Data/Utills/socket';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../../../Data/Selectors/User';
import { getCurrentPage, getCurrentRole } from '../../../../Data/Selectors/Navigation';

interface Member {
    email: string;
    firstname: string;
    secondname: string;
    role: string;
}

const LinkAPI = ({ Close, Submit, Code }: any) => {
    const [assignedTo, setassignedTo] = useState('');
    const [members, setMembers] = useState<Member[]>([]);

    const currentUser = useSelector(getCurrentUser)

    const groupRole = useSelector(getCurrentRole)

    const groupName = useSelector(getCurrentPage)

    const handleChange = (event: SelectChangeEvent) => {
        setassignedTo(event.target.value);
    };

    useEffect(() => {
        socket.emit("request-members", { token: groupName, user: currentUser, role: groupRole })

        socket.on('members', (data: any) => {
            setMembers(data);
        })
    }, [])

    const renderItems = (item: any) => {
        const { email, firstname, secondname, role } = item

        const username = firstname + " " + secondname[0] + "."

        return (
            <MenuItem key={email} value={email}> {username} </MenuItem>
        )
    }

    return (
        <motion.div className="popup-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>


            <div className="link-popup">
                <button className='close-btn' onClick={Close}></button>
                <h1> Link {Code} </h1>
                <hr/>
                <form className='create-task-form' onSubmit={Submit}>
                    <input id='code' type='hidden' defaultValue={Code}/>
                    <input className="form__field" id='link' type={`${Code === 'API' ? 'password' : 'input'}` } placeholder="Link" defaultValue={''} />
                    <button className='submit-btn'> Submit </button>
                </form>

            </div>


        </motion.div>
    );
};

export default LinkAPI;