import React, { useEffect, useRef, useState } from 'react';
import './drag.css';
import store from '../../../Data/Objects/Store';
import { Roles } from '../../../Data/Objects/State';
import CreateTaskBox from './createTask/createTask';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../../Data/Selectors/User';
import socket from '../../../Data/Utills/socket';
import { getCurrentPage } from '../../../Data/Selectors/Navigation';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Bounce, toast } from 'react-toastify';
import { color } from 'framer-motion';
import telegram from '../../../Assets/Telegram_2019_Logo.svg';
import inst from '../../../Assets/Instagram_logo_2016.svg.png';
import facebook from '../../../Assets/Facebook_F_icon.svg';
import { group } from 'console';
import LinkAPI from './Link/LinkAPI';
import axios, { AxiosError } from 'axios';
import { ids } from 'webpack';
import { url } from 'inspector';

interface Task {
    taskid: number;
    roomid: number;
    description: string;
    status: 'Todo' | 'In Progress' | 'Needs Review' | 'Completed';
    assigned_by: number;
    assigned_to: number | null;
    taken_by: number | null;
    taken_at: string | null;
    needs_review_at: string | null;
    completed_at: string | null;
    deadline: string | null;
    remainingTime?: number | null;
}

interface FigmaResponse {
    images: Record<string, string>;
    err: string | null;
  }

  

export default function DragAndDrop({ selectedRoom }: any) {

    const [showCreateTask, setShowCreateTask] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([])
    const currentUser = useSelector(getCurrentUser)
    const currentPage = useSelector(getCurrentPage)

    const [isEditable, setIsEditable] = useState(false);
    const [projectName, setProjectName] = useState('Name');
    const [projectDescription, setProjectDescription] = useState('Project Description');
    const [mainGoal, setMainGoal] = useState('Text');
    const [Budget, setBudget] = useState('$$$$$');
    const [KPI, setKPI] = useState('%%%%');
    const [addGoals, setAddGoals] = useState('Project Description');
    const [customerName, setCustomerName] = useState('Name');
    const [customerPhone, setCustomerPhone] = useState('+380 (***) ***-****');
    const [ig, setIG] = useState('TAG');
    const [fb, setFB] = useState('TAG');
    const [tg, setTG] = useState('TAG');

    const [figmaApi, setFigmaApi] = useState(null);
    const [figmaDesign, setFigmaDesign] = useState<string | undefined>(undefined);
    const [figmaStrategy, setFigmaStrategy] = useState<string | undefined>(undefined);

    const [figmaDesignImg, setFigmaDesignImg] = useState('');
    const [figmaStrategyImg, setFigmaStrategyImg] = useState('');

    

    const [linkFigma, setLinkFigma] = useState(false);
    const [linkCode, setLinkCode] = useState('default');


    type RequestType = "GET" | "POST" | "PATCH" | "DELETE"
    function Request<T>(url:any, path: string, token: string, type: RequestType, params?: any, body?: T ) {
        return new Promise((resolve, reject) => {
            console.log(`${ url }/${path}`)
            axios({
                method: type,
                url: `${ url }/${path}`,
                params: params,
                data: body,
                headers: {
                    "X-Figma-Token":  token 
                }
            })
            .then(response => {
                if(response.status === 200 && response.status < 300 ){
                    resolve(response.data)
                } else{
                    reject(new Error(`Request failed with status ${response.status}`));
                }
            }).catch((error: AxiosError) => {
                if (error.response) {
                    
                    reject(new Error(`Request failed with status ${error.response.status}`));
                } else if (error.request) {
                    
                    reject(new Error("Request failed: no response received"));
                } else {
                    
                    reject(new Error("Request failed: " + error.message));
                }
            });
        } )}

        const handleFigmaRequest = () => {
            if (figmaApi === null) {
                console.error("Figma API token is not set");
                return;
            }
    
            if (!figmaDesign) {
                console.error("Figma design link is not set");
                return;
            }
            if (!figmaStrategy) {
                console.error("Figma design link is not set");
                return;
            }


            const DesignfileKey = extractFileKey(figmaDesign);
            if (!DesignfileKey) {
                console.error("Invalid Figma link format");
            return;
            }

            const StrategyfileKey = extractFileKey(figmaStrategy);
            if (!StrategyfileKey) {
                console.error("Invalid FigmaJam link format");
            return;
            }

            const ids = '0:1';

            Request<FigmaResponse>(
                'https://api.figma.com', 
                `v1/images/${DesignfileKey}`, 
                figmaApi,
                "GET", 
                { ids } , 
                undefined,
            ).then(data => {
                setFigmaDesignImg(data.images["0:1"])
            }).catch(error => {
                console.error("Error fetching file:", error.message);
            })

            Request<FigmaResponse>(
                'https://api.figma.com', 
                `v1/images/${StrategyfileKey}`, 
                figmaApi,
                "GET", 
                { ids } , 
                undefined,
            ).then(data => {
                setFigmaStrategyImg(data.images["0:1"])
            }).catch(error => {
                console.error("Error fetching file:", error.message);
            })
        };

        const extractFileKey = (url: string): string | null => {
            if (url.includes('/design/')) {
                // Извлекаем file key из ссылки типа "design"
                return url.split('/design/')[1]?.split('/')[0] || null;
            } else if (url.includes('/board/')) {
                // Извлекаем file key из ссылки типа "board"
                return url.split('/board/')[1]?.split('/')[0] || null;
            }
            console.error("Invalid Figma link format");
            return null;
        };        
    
    useEffect(() => {
        setFigmaDesignImg('')
        setFigmaStrategyImg('')
        socket.emit('request-tasks', { room: selectedRoom, group: currentPage })

        socket.on('update-tasks', () => {
            socket.emit('request-tasks', { room: selectedRoom, group: currentPage })
        })

        socket.emit('request-project',{ room: selectedRoom, group: currentPage })

        socket.on('project-update-request', () =>{
            socket.emit('request-project',{ room: selectedRoom, group: currentPage })
        })

        socket.on('recieve-tasks', (fetchedData: any) => {
            if (fetchedData.tasksResult?.rows) {
                const tasksWithRemainingTime = fetchedData.tasksResult.rows.map((task: Task) => {

                    task.deadline = formatTimestamp(task.deadline); // Format the deadline

                    task.remainingTime = calculateTimeDifference(task.deadline);
                    return task;
                });

                tasksWithRemainingTime.sort((a: Task, b: Task) => (a.remainingTime || 0) - (b.remainingTime || 0));
                setTasks(tasksWithRemainingTime);
            } else {
                setTasks([]);
            }
        })

        socket.on('recieve-project', (fetchedData: any) =>{
            const result = fetchedData.infoResult?.rows[0]
            if(result.name === selectedRoom.name){
                setProjectName(result.projectname ?? "Name");
                setProjectDescription(result.projectdesc ?? "Project Description");
                setMainGoal(result.goal ?? "Goal");
                setBudget(result.budget ?? "$$$$$");
                setKPI(result.kpi ?? "%%%%%%");
                setAddGoals(result.addgoals ?? "None");
                setCustomerName(result.customer_name ?? "Name");
                setCustomerPhone(result.customer_phone ?? "+380 (***) ***-****");
                setIG(result.customer_instagram ?? "TAG");
                setFB(result.customer_facebook ?? "TAG");
                setTG(result.customer_telegram ?? "TAG");
            }
        })

        socket.emit('links', { room: selectedRoom, group: currentPage },(response: any) =>{
            setFigmaApi(response.request.rows[0].figmaapi ?? null);
            setFigmaStrategy(response.request.rows[0].figmajamlink ?? null);
            setFigmaDesign(response.request.rows[0].figmalink ?? null);
        })

        socket.on('update-links', (fetchedData:any)=>{
            switch(fetchedData.massage){
                case 'FigmaApiUpdate':
                    setFigmaApi(fetchedData.link);
                    break;
                case 'FigmaLinkUpdate':
                    setFigmaDesign(fetchedData.link)
                    break;
                case 'FigmaJamUpdate':
                    setFigmaStrategy(fetchedData.link)
                    break;
            }
        })

        return () => {
            socket.off('update-tasks');
            socket.off('recieve-tasks');
            socket.off('project-update-request');
            socket.off('recieve-project');
            socket.off('update-links')
        };
    }, [selectedRoom])

    useEffect(() => {
        if (figmaApi && figmaDesign && figmaStrategy) {
            handleFigmaRequest();
        }
    }, [figmaApi, figmaDesign, figmaStrategy]);

    const handleCreateTask = () => {
        if (showCreateTask === true) {
            setShowCreateTask(false)
        } else {
            setShowCreateTask(true)
        }
    }

    const handleLink = (code:any) => {

        if (linkFigma === true) {
            setLinkFigma(false)
        } else {
            setLinkCode(code)
            setLinkFigma(true)
        }
    }

    const handleFigmaSubmit = (e:any) =>{
        e.preventDefault();
        const link = e?.target?.link?.value;
        const code = e?.target?.code?.value;
        socket.emit('saveLink', {room: selectedRoom, link, code})
        setLinkFigma(false)
    }

    const handleTaskSubmit = (e: any) => {
        e.preventDefault();
        const select = e?.target?.select?.value;
        const textarea = e?.target?.textarea?.value;
        const deadline = e?.target?.deadline?.value;
        socket.emit('create-task', { user: currentUser?.email, selecteduser: select, textarea: textarea, room: selectedRoom, deadline: deadline })
        setShowCreateTask(false)
    }

    function formatTimestamp(timestamp: any) {
        const date = new Date(timestamp);

        const day = date.getDate().toString().padStart(2, '0'); // Get day and add leading zero if needed
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month (0-based) and add leading zero
        const hours = date.getHours().toString().padStart(2, '0'); // Get hours and add leading zero
        const minutes = date.getMinutes().toString().padStart(2, '0'); // Get minutes and add leading zero

        return `${day}/${month} ${hours}:${minutes}`;
    }

    const calculateTimeDifference = (deadline: any) => {
        if (!deadline) return null; // Add a check for null or undefined formattedDeadline

        const [dateString, timeString] = deadline.split(' ');
        if (!dateString || !timeString) {
            console.error("Invalid formattedDeadline:", deadline);
            return null;
        }

        let day, month;
        if (dateString.includes('/')) {
            [day, month] = dateString.split('/');
        } else if (dateString.includes('.')) {
            [day, month] = dateString.split('.');
        } else {
            console.error("Invalid dateString format:", dateString);
            return null;
        }

        const [hours, minutes] = timeString.split(':');
        if (!day || !month || !hours || !minutes) {
            console.error("Invalid dateString or timeString:", dateString, timeString);
            return null;
        }

        const currentYear = new Date().getFullYear();
        const deadlineDate = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));

        if (isNaN(deadlineDate.getTime())) {
            console.error("Invalid deadlineDate:", deadlineDate);
            return null;
        }

        const now = new Date();
        const difference = deadlineDate.getTime() - now.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        return Math.ceil(difference / oneDay);
    };

    const getDeadlineColor = (remainingDays: any) => {
        if (remainingDays < 0) {
            return 'red'
        } else if (remainingDays <= 1) {
            return '#FF6347';
        } else if (remainingDays <= 3) {
            return '#FFA500';
        } else {
            return '#32CD32';
        }
    };

    const deleteTask = (taskid: any, roomid: any) => {
        socket.emit('delete-task', { taskid: taskid, roomid: roomid })
    }

    const renderTask = (task: any, index: number) => {

        const assigned_by = task?.assigned_by_firstname
            ? `${task.assigned_by_firstname} ${task.assigned_by_secondname[0]}.`
            : "N/A";

        const assigned_to = task?.assigned_to_firstname
            ? `${task.assigned_to_firstname} ${task.assigned_to_secondname[0]}.`
            : "Everyone";

        const taken = task?.taken_by_firstname
            ? `${task.taken_by_firstname} ${task.taken_by_secondname[0]}.`
            : "N/A";

        return (<Draggable key={task.taskid} draggableId={`${task.taskid}`} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="task"
                >
                    <div className='label-exit'>
                        <p className='label'> {task.description.charAt(0).toUpperCase() + task.description.slice(1)} </p>
                        <IconButton size='small' color='inherit' onClick={() => deleteTask(task.taskid, task.roomid)}>
                            <DeleteIcon className='exit' />
                        </IconButton>
                    </div>
                    <div className='task-info'>
                        <div className='assigned-section'>

                            {task.status === 'Todo' && <div className='assigned-element'>
                                <p> Assigned to </p> <div className='assigned'> {assigned_to} </div>
                            </div>}

                            {task.status != 'Todo' && <div className='assigned-element'>
                                <p> Taken By </p> <div className='assigned'> {taken} </div>
                            </div>}

                            {(task.status === 'Todo' || task.status === 'In Progress') && <div className='assigned-element'>
                                <p> DeadLine </p> <div className='assigned' style={{ backgroundColor: getDeadlineColor(task.remainingTime) }}> {task.deadline} </div>
                            </div>}

                            {task.status === 'Needs Review' && <div className='assigned-element'>
                                <p> Added: {formatTimestamp(task.needs_review_at)} </p>
                            </div>}

                            {task.status === 'Completed' && <div className='assigned-element'>
                                <p> Submited: {formatTimestamp(task.completed_at)} </p>
                            </div>}


                            {task.status != 'Completed' && <p className='remainingTime'> Days left: {task.remainingTime} </p>}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>)


    }



    const onDragEnd = (result: any) => {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        const sourceIndex = source.index;
        const destinationIndex = destination.index;
        console.log(source)
        console.log(destination)

        const updatedTasks = Array.from(tasks);
        const [removedTask] = updatedTasks.splice(sourceIndex, 1);
        updatedTasks.splice(destinationIndex, 0, removedTask);

        socket.emit('update-task-status', {
            taskid: result.draggableId,
            status: destination.droppableId,
            group: currentPage,
            user: currentUser,
            source: source.droppableId
        }, (response: any) => {
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
            }
        });
    };

    const handleColumnTasks = (column: string) => {
        return tasks.filter(task => task.status === column);
    };

    const handleEditToggle = () => {
        console.log(figmaApi)
            console.log(figmaDesign)
            console.log(figmaStrategy)

        if (isEditable) {
            
            
            socket.emit('update-project', {
                room: selectedRoom,
                group: currentPage,
                name: document.getElementById('name')?.textContent,
                description: document.getElementById('desc')?.textContent,
                goal:document.getElementById('main_goal')?.textContent,
                budget:document.getElementById('budget')?.textContent,
                KPI:document.getElementById('kpi')?.textContent,
                add_goals:document.getElementById('add_goals')?.textContent,
                customer_name:document.getElementById('customer_name')?.textContent,
                number:document.getElementById('phone_number')?.textContent,
                inst:document.getElementById('insta')?.textContent,
                fb:document.getElementById('fb')?.textContent,
                tg:document.getElementById('tg')?.textContent,

            });
    
            setIsEditable(false);
        } else {

            setIsEditable(true);
        }
    }

    const renderFigmaLinks = () => {
        if (figmaApi === null) {
          return (
            <div className="links">
                <a onClick={(e)=> {handleLink("API")}}> Link Figma API </a>
            </div>
        )
        }
        return (
            <div className="links">
                <a onClick={(e)=> {handleLink("Design")}}>Link to Designs</a>
                <a onClick={(e)=> {handleLink("API")}}>Update API</a>
                <a onClick={(e)=> {handleLink("Strategy")}}>Link to Strategy</a>
            </div>
        )
      }




    return (
        <section className='contentsection'>
            <div className="projectinfo">
                    <div className="projectname"> 
                        <h1 className={`name ${isEditable ? 'editable' : ''}` } id='name' contentEditable={isEditable} suppressContentEditableWarning>  {projectName} </h1> 
                        <p className={`desc ${isEditable ? 'editable' : ''}`} id='desc' contentEditable={isEditable} suppressContentEditableWarning> {projectDescription} </p> </div> 
                    <div className="img"> <img className="projectlogo" src="https://avatar.iran.liara.run/public/32" /> </div>
                </div>

                <button onClick={handleEditToggle} className='submit-btn edit'> {isEditable ? 'Save' : 'Edit'} </button>
                <div className="additionalsandcontacts">
                    <div className="additional">
                        <div className='add_element'>
                            <h3>Main Goal: </h3>    <p className={isEditable ? 'editable' : ''} id='main_goal' contentEditable={isEditable} suppressContentEditableWarning> {mainGoal} </p>
                        </div>
                        <hr className='add_interval'/>
                        <div className='add_element'>
                            <h3>Budget: </h3>   <p className={isEditable ? 'editable' : ''} id='budget' contentEditable={isEditable} suppressContentEditableWarning> {Budget} </p>
                        </div>
                        <hr className='add_interval'/>
                        <div className='add_element'>
                            <h3>KPI: </h3>  <p className={isEditable ? 'editable' : ''} id='kpi' contentEditable={isEditable} suppressContentEditableWarning> {KPI}</p>
                        </div>
                        <hr className='add_interval'/>
                        <div className='add_element'>
                            <h3>Additional goals: </h3> <p className={isEditable ? 'editable' : ''} id='add_goals' contentEditable={isEditable} suppressContentEditableWarning> {addGoals}</p>
                        </div>
                        <hr className='add_interval'/>

                    </div>
                    <div className="additional contacts">
                        <div className='contacts_element'>
                            <h3> Customer name: </h3> <p className={isEditable ? 'editable' : ''} id='customer_name' contentEditable={isEditable} suppressContentEditableWarning> {customerName} </p>
                        </div>
                        <div className='contacts_element'>
                            <h3> Phone Number: </h3> <p className={isEditable ? 'editable' : ''} id='phone_number' contentEditable={isEditable} suppressContentEditableWarning> {customerPhone} </p>
                        </div>
                        <div className='contacts_element'>
                            <img className='contact_logo' src={inst} /> <h3> Instagram: </h3> <a className={isEditable ? 'editable' : ''} href={`https://www.instagram.com/${ig.trim()}`} target='_blank' id='insta' contentEditable={isEditable} suppressContentEditableWarning> {ig} </a>
                        </div>
                        <div className='contacts_element'>
                            <img className='contact_logo' src={facebook} /> <h3> Facebook: </h3> <a className={isEditable ? 'editable' : ''} href={`https://www.facebook.com/${fb.trim()}`} target='_blank' id='fb' contentEditable={isEditable} suppressContentEditableWarning> {fb} </a>
                        </div>
                        <div className='contacts_element'>
                            <img className='contact_logo' src={telegram} /> <h3>Telegram: </h3> <a className={isEditable ? 'editable' : ''} href={`https://t.me/${tg.trim()}`} id='tg' target='_blank' contentEditable={isEditable} suppressContentEditableWarning> {tg} </a>
                        </div>
                    </div>
                </div>
                <div className='second-section'>
                    <div>
                        <h1 style={{color:'white'}}>Figma links</h1>
                        {renderFigmaLinks()}
                    </div>
                    <div className='figmaImg'>
                        <h2>Design</h2>
                            {figmaDesignImg ? (
                            <a href={figmaDesign} target='_blank' rel="noopener noreferrer">
                            <img src={figmaDesignImg} alt="Design" />
                            </a>
                            ) : (<div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>)}
                        <h2>Strategy</h2>
                            {figmaStrategy && figmaStrategyImg ? (
                            <a href={figmaStrategy} target='_blank' rel="noopener noreferrer">
                            <img src={figmaStrategyImg} alt="Strategy" />
                            </a>
                            ) : ( <div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>)}
                    </div>
                </div>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="drag-and-drop-container">
                <Droppable key={'Todo'} droppableId={'Todo'}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="droppable"
                        >
                            <h3> Todo </h3>
                            <hr />
                            <div className='task-section'>
                                {handleColumnTasks('Todo').map((task, index) => renderTask(task, index))}

                                {store.getState().Navigation.groupRole == Roles.OWNER &&
                                    <div className='create-task' onClick={handleCreateTask}>
                                        <p> Create Task </p>
                                    </div>
                                }
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable key={'In Progress'} droppableId={'In Progress'}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="droppable"
                        >
                            <h3> In Progress </h3>
                            <hr />
                            <div className='task-section'>
                                {handleColumnTasks('In Progress').map((task, index) => renderTask(task, index))}
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable key={'Needs Review'} droppableId={'Needs Review'}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="droppable"
                        >
                            <h3> Needs Review </h3>
                            <hr />
                            <div className='task-section'>
                                {handleColumnTasks('Needs Review').map((task, index) => renderTask(task, index))}
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable key={'Completed'} droppableId={'Completed'}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="droppable"
                        >
                            <h3> Completed </h3>
                            <hr />
                            <div className='task-section'>
                                {handleColumnTasks('Completed').map((task, index) => renderTask(task, index))}
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                {showCreateTask && <CreateTaskBox Close={handleCreateTask} Submit={handleTaskSubmit} />}
                {linkFigma && <LinkAPI Close={handleLink} Submit={handleFigmaSubmit} Code={linkCode} />}
            </div>
        </DragDropContext>
        </section>
    );

};