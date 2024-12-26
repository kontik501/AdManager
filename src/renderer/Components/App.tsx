import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import '../Styles/App.css';
import LoginPage from './Login/index';
import { getCurrentPage } from '../Data/Selectors/Navigation';
import { useDispatch, useSelector } from 'react-redux';
import MainPage from './MainPage/main';
import { getAuthToken, getCurrentUser } from '../Data/Selectors/User';
import { Pages } from '../Data/Objects/State';
import 'react-toastify/dist/ReactToastify.css';
import io, { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { AsyncDispatch } from '../Data/Utills/Redux';
import { setActivePage } from '../Data/Actions/Navigation';

export default function App() {

  const currentPage = useSelector(getCurrentPage);
  const dispatch: AsyncDispatch = useDispatch();
  const setCurrentPage = (page: Pages) => dispatch(setActivePage(page))
  const currentUser = useSelector(getCurrentUser);
  const authToken = useSelector(getAuthToken)

  const renderMainContent = () => {
    if (!currentUser || !authToken) {
      return <LoginPage />
    }
    return <MainPage User={currentUser} />
  }


  return (
    <div className='app'>
      {renderMainContent()}
    </div>
  );
}
