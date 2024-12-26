import "./main.css"
import { motion } from "framer-motion";


export default function Home({user}:any) {

    
    return (
        <motion.div 
            className="home-page"
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 0, opacity: 0 }}
            transition={{stiffness: 120, duration: 0.5 }}>

                <h2> Hello {user.firstname}! </h2>
                <p> To start work with app you need to create, or choose group at the top-left corner </p>
                <p> Good luck in work! </p>

        </motion.div>
    )
}