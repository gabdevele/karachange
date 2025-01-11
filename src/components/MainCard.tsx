import { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import { toast } from 'react-toastify';

const MainCard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [viewLink, setViewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShown, setErrorShown] = useState(false);

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast.success('Pasted from clipboard.', { autoClose: 1500 });
    } catch (error) {
      toast.error('Failed to read from clipboard.', { autoClose: 1500 });
    }
  };

  const handleButtonClick = async () => {
    if (viewLink) {
      setViewLink('');
      setUrl('');
      return;
    }
    if (!url) {
      if (!errorShown) {
        toast.error('Please enter a YouTube URL.');
        setErrorShown(true);
        setTimeout(() => setErrorShown(false), 3000);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://gabdevele.ddns.net/karachange/api/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.viewLink) {
        setViewLink(data.viewLink);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error while fetching video link: ", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleShineEnd = (e: React.AnimationEvent<HTMLElement>) => {
    const target = e.target as HTMLElement; //nosense cause I already wrote HTMLElement but typescript gives me error.
    target.style.backgroundImage = 'linear-gradient(90deg, var(--text-color) 17.85%, #fff 0%, var(--text-color) 100%)';
  };

  return (
    <motion.div 
      className='flex flex-col justify-center items-center bg-primary text-white p-4 sm:p-8 min-h-96 mx-4 rounded-lg shadow-lg'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
    <motion.h1
      className="text-5xl font-bold text-red-500 mb-4 shine"
      onAnimationEnd={handleShineEnd}
    >
      Kara
      <span className="text-slate-200">
        Change
      </span>
    </motion.h1>
      <p className="text-md sm:text-lg text-gray-400 mb-8 text-center">
        Transform your karaoke experience! <br />
        Adjust key and tempo effortlessly without any extensions or downloads.
      </p>
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Paste a YouTube URL"
          value={url}
          onChange={handleInputChange}
          className="px-4 py-2 w-64 sm:w-96 
          bg-stone-800 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        />
        <motion.button 
          onClick={handlePasteClick} 
          className="ml-2 text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon icon="akar-icons:clipboard" width={24} height={24} />
        </motion.button>
      </div>
      {viewLink && <VideoPlayer viewLink={viewLink} />}

      {!loading && <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.85 }}
        onClick={handleButtonClick}
        className="px-6 py-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition duration-300 mb-2 mt-2"
      >
        {!viewLink ? <span className='flex items-center gap-1'>Play <Icon icon="akar-icons:play" width={18} height={18} /></span> :
          <span className='flex items-center gap-1'>New Video <Icon icon="material-symbols:refresh-rounded" width={18} height={18} /></span>
        }
      </motion.button>}
      {loading && (
        <div className="mt-4 w-64 sm:w-96  h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 animate-loading-bar"></div>
        </div>
      )}
    </motion.div>
  );
};

export default MainCard;