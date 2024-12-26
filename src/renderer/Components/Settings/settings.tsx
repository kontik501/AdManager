import { useSelector } from "react-redux";
import "./settings.css"
import { motion } from 'framer-motion';
import { getCurrentPage } from "../../Data/Selectors/Navigation";
import { useEffect } from "react";

interface SettingProps {
    Close: () => void;
    changeFcn: () => void;
    invite: string;
    saveSettings: (e:any) => void;
    Delete: () => void;
  }

const Settings = ({ Close, invite, changeFcn, saveSettings, Delete }: SettingProps) => {

    const groupName = useSelector(getCurrentPage)

  return (
    <motion.div className="popup-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>


      <div className="settings-popup">
      <button className='close-btn' onClick={ Close }></button>
        <div className="settings-label">
            <h2>Settings</h2>
        </div>
      <form className='settings-form' onSubmit={ saveSettings }>
        <div className="form__group field">
        <input id='name' type="input" className="form__field" placeholder="Name" defaultValue={groupName} />
        <label htmlFor="name" className="form__label"> Group Name </label>
        </div>
        <button className='save-changes-btn submit-btn'> Save Changes </button>
        </form>
        <div className="invite-code">
            <p>Invite code: { invite }</p>
            <button className='invite-btn' onClick={changeFcn}> Generate new code </button>
            <button className='invite-btn' onClick={() => {navigator.clipboard.writeText(invite)}}> Copy </button>
        </div>
        <button className='delete-btn' onClick={ Delete }> Delete Group </button>
      </div>

    </motion.div>
  );
};

export default Settings;