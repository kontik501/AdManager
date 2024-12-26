import './createroom.css';
import { motion } from 'framer-motion';

const CreateRoom = ({ Close, Submit }: any) => {
  return (
    <motion.div className="popup-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>


      <div className="room-popup">
      <button className='close-btn' onClick={ Close }></button>
        <form className='create-form' onSubmit={ Submit }>
        <div className="form__group field">
        <input id='name' type="input" className="cform__field" placeholder="Name" required />
        <label htmlFor="name" className="cform__label"> Room Name </label>
        </div>

        <button className='submit-btn'> Create </button>
        
        </form>

      </div>


    </motion.div>
  );
};

export default CreateRoom;