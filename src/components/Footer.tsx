import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  return (
    <>
      <motion.footer className="text-gray-400 text-center mt-8 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <span className='underline-offset-2 underline cursor-pointer' onClick={togglePopup}>Terms of Service</span>
        <p>
          Made with ❤️ by <a href="https://github.com/gabdevele" className="text-red-500 underline" target="_blank" rel="noreferrer">@gabdevele</a>
        </p>
      </motion.footer>
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-slate-100 text-black p-4 sm:p-8 rounded-lg shadow-lg max-w-lg w-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Terms of Service</h2>
              <p className="text-sm sm:text-base mb-4">
                This website was created for educational purposes and is not affiliated with YouTube. Please note that you are responsible for how you use the site and any content you download.
                Downloaded content is intended for personal and non-commercial use only. Videos are stored temporarily and are never shared with third parties.
                We kindly remind you to respect YouTube's terms of service: downloading videos directly from the platform is strictly prohibited, so do not use this website to download content.
                If you have any questions or encounter any issues, feel free to contact me <a href="mailto:schiraldigabriele@gmail.com" className="text-red-500 underline">here</a>.
              </p>
              <button onClick={togglePopup} className="px-4 py-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition duration-300">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;