import { createRoot } from 'react-dom/client';
import App from './Components/App';
import { Provider } from 'react-redux';
import  store, { persistor } from './Data/Objects/Store';
import { PersistGate } from 'redux-persist/integration/react';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <Provider store={ store }>
    <PersistGate persistor={persistor} >
      <App />
    </PersistGate>
  </Provider>
);

window.electron.ipcRenderer.once('ipc-example', (arg) => {
  
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
