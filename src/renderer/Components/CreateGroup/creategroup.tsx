import './creategroup.css';
import { motion } from 'framer-motion';

const CreateGroupBox = ({ Close, Submit }: any) => {
  return (
    <motion.div className="popup-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>


      <div className="popup">
      <button className='close-btn' onClick={ Close }></button>
        <h1>Create Group</h1>
        <form className='create-form' onSubmit={ Submit }>
        <div className="form__group field">
        <input id='name' type="input" className="cform__field" placeholder="Name" required />
        <label htmlFor="name" className="cform__label"> Group Name </label>
        </div>

        <button className='submit-btn'> Create </button>
        
        </form>

      </div>


    </motion.div>
  );
};

export default CreateGroupBox;