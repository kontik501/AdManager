import React, { useEffect, useState } from 'react';
import './statistic.css';
import socket from '../../Data/Utills/socket';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../Data/Selectors/User';
import { getCurrentPage } from '../../Data/Selectors/Navigation';
import moment from 'moment';
import TaskChart from './taskchart';


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
    assigned_by_firstname?: string | null;
    assigned_by_secondname?: string | null;
    assigned_to_firstname?: string | null;
    assigned_to_secondname?: string | null;
    taken_by_firstname?: string | null;
    taken_by_secondname?: string | null;
}

export default function Statistic() {

    const currentUser = useSelector(getCurrentUser)
    const currentPage = useSelector(getCurrentPage)

    const [averageCompletionTime, setAverageCompletionTime] = useState<string | null>(null);
    const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
    const [overdueTasksCount, setOverdueTasksCount] = useState<number>(0);
    const [successRate, setSuccessRate] = useState<number>(0);

    const [tasks, setTasks] = useState<Task[]>([])

    const workerCompletionCounts: Record<string, number> = {};

    const currentTime = new Date();

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };


    useEffect(() => {

        socket.emit('request-tasks', { room: "All", group: currentPage })

        socket.on('update-tasks', () => {
            socket.emit('request-tasks', { room: "All", group: currentPage })
        })

        socket.on('recieve-tasks', (fetchedData: any) => {
            setTasks(fetchedData.tasksResult.rows);
        })


    }, [])

    useEffect(() => {

        const completionTimesInSeconds: number[] = [];
        const workerCompletionCounts: Record<string, number> = {};


        tasks.forEach(task => {
            if (task.taken_at && task.completed_at) {
                const takenAt = moment(task.taken_at);
                const completedAt = moment(task.completed_at);
                const duration = moment.duration(completedAt.diff(takenAt));
                const durationInSeconds = moment.duration(completedAt.diff(takenAt)).asSeconds();
                completionTimesInSeconds.push(durationInSeconds);
            }

            if (task.taken_by_firstname) {
                if (!workerCompletionCounts[task.taken_by_firstname]) {
                    workerCompletionCounts[task.taken_by_firstname] = 0;
                }
                if (task.status === 'Completed') {
                    workerCompletionCounts[task.taken_by_firstname]++;
                }
            }
        });

        if (completionTimesInSeconds.length > 0) {
            const totalSeconds = completionTimesInSeconds?.reduce((a, b) => a + b, 0);
            const avgSeconds = totalSeconds / completionTimesInSeconds.length;
            const avgTimeFormatted = formatTime(avgSeconds);
            setAverageCompletionTime(avgTimeFormatted);
        } else {
            setAverageCompletionTime(null);
        }

        const countCompletedTasks = tasks.filter(task => task.status === 'Completed').length;
        setCompletedTasksCount(countCompletedTasks);


        const overdueTasks = tasks.filter(task => {
            if (task.status !== 'Completed' && task.deadline) {
                const deadline = moment(task.deadline);
                return deadline.isBefore(moment());
            }
            return false;
        });
        setOverdueTasksCount(overdueTasks.length);

        const successTasks = tasks.filter(task => {
            if (task.status === 'Completed' && task.deadline && task.completed_at) {
                const deadline = moment(task.deadline);
                const completedAt = moment(task.completed_at);
                return completedAt.isSameOrBefore(deadline);
            }
            return false;
        });

        const successRate = (successTasks.length / tasks.length) * 100;
        setSuccessRate(successRate);

    }, [tasks])

    const calculateWorkerProductivity = () => {

        tasks.forEach(task => {
            if (task.status === 'Completed' && task.taken_by_firstname) {
                if (!workerCompletionCounts[task.taken_by_firstname + ' ' + task.taken_by_secondname]) {
                    workerCompletionCounts[task.taken_by_firstname + ' ' + task.taken_by_secondname] = 0;
                }
                workerCompletionCounts[task.taken_by_firstname + ' ' + task.taken_by_secondname]++;
            }
        });

        const productiveWorker = Object.keys(workerCompletionCounts).reduce((a, b) => workerCompletionCounts[a] > workerCompletionCounts[b] ? a : b, '');
        const unproductiveWorker = Object.keys(workerCompletionCounts).reduce((a, b) => workerCompletionCounts[a] < workerCompletionCounts[b] ? a : b, '');

        return { productiveWorker, unproductiveWorker };
    };

    const productivity = calculateWorkerProductivity()
    const todoTasksCount = tasks.filter(task => task.status === 'Todo' || task.status === 'In Progress').length;

    const renderTasks = (task: any) => {

        const takenAtTime = new Date(task.taken_at);

        const timeDifference = currentTime.getTime() - takenAtTime.getTime();

        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

        const timeString = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;

        return (
            <div key={task.taskid} className='task-card'>
                <div className='task-description'>
                    {task.description}
                </div>
                <hr />

                <div className='task-card-info'>
                    <p>Status: {task.status}</p>
                    <p>Worker: {task.taken_by_firstname + " " + task.taken_by_secondname} </p>
                    <p>In work for: {timeString} </p>
                </div>
            </div>
        )
    }


    const renderdata = () => {

        return (
            <div className='statistic-component'>


                <h2 className='head'> Statistic of {currentPage} </h2>

                <div className='base-stats'>
                    <div className='stat-block'>
                        <h2> Average task completion time: {averageCompletionTime} </h2>
                        <h2> Tasks completed: {completedTasksCount} </h2>
                    </div>

                    <div className='stat-block'>
                        <h2> Top performer by completed tasks: {productivity.productiveWorker} </h2>
                        <h2> Worst performer by completed tasks: {productivity.unproductiveWorker} </h2>
                    </div>
                </div>


                <div className="statistics-container">
                    <div className="statistic-item">
                        <h2> Tasks thats needs review: {tasks.filter(task => task.status === 'Needs Review').length}</h2>
                        <hr />

                    </div>
                    <div className="statistic-item">
                        <h2> Tasks with overdue deadline: {overdueTasksCount}</h2>
                        <hr />
                    </div>
                    <div className="statistic-item">
                        <h2> Company success rating: {Math.round(successRate)} %</h2>
                        <hr />
                    </div>

                    <div className="statistic-item">
                        <h2> Task thats needs to be done: {todoTasksCount}</h2>
                        <hr />
                    </div>
                </div>
                <TaskChart workerCompletionCounts={workerCompletionCounts} />

                <h2 style={{ textAlign: 'center', marginTop: '30px' }}> Tasks still in progress:</h2>
                <hr />
                <div className='task-container'>
                    {tasks.filter(task => task.status === 'In Progress').map((task) => renderTasks(task))}
                </div>
                <div className='footer'></div>
            </div>
        )

    }




    return (
        <div>
            {renderdata()}
        </div>
    );

};