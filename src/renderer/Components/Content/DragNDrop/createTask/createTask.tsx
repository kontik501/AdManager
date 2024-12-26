import './createTask.css';
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

const CreateTaskBox = ({ Close, Submit }: any) => {
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


            <div className="task-popup">
                <button className='close-btn' onClick={Close}></button>
                <h1>New Task</h1>
                <hr />
                <form className='create-task-form' onSubmit={Submit}>
                    <div className='assigned-to-selector'>
                        <FormControl className='selector' sx={{ minWidth: 200 }}>
                            <Select
                                value={assignedTo}
                                onChange={handleChange}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Without label', 'id': 'select' }}
                            >
                                <MenuItem value="">
                                    <em>Anyone</em>
                                </MenuItem>
                                {members.map(renderItems)}
                            </Select>
                        </FormControl>
                        <p> Assigned To </p>
                    </div>
                    <div className='assigned-to-selector'>
                        <input type="datetime-local" id="deadline" name="deadline" required />
                        <p> Deadline </p>
                    </div>
                    <hr />
                    <div className='text-area'>
                        <p> Description </p>
                        <Textarea
                            minRows={3}
                            maxRows={3}
                            placeholder="Type in here…"
                            variant="soft"
                            slotProps={{
                                textarea: {
                                    id: 'textarea'
                                }
                            }}
                            sx={{
                                maxWidth: 400,
                                borderBottom: '2px solid',
                                borderColor: 'neutral.outlinedBorder',
                                borderRadius: 0,
                                '&:hover': {
                                    borderColor: 'neutral.outlinedHoverBorder',
                                },
                                '&::before': {
                                    border: '1px solid var(--Textarea-focusedHighlight)',
                                    transform: 'scaleX(0)',
                                    left: 0,
                                    right: 0,
                                    bottom: '-2px',
                                    top: 'unset',
                                    transition: 'transform .15s cubic-bezier(0.1,0.9,0.2,1)',
                                    borderRadius: 0,
                                },
                                '&:focus-within::before': {
                                    transform: 'scaleX(1)',
                                },
                            }}
                        />
                    </div>


                    <button className='submit-btn'> Create </button>

                </form>

            </div>


        </motion.div>
    );
};

export default CreateTaskBox;