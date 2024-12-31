import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './App.css'; 
import VideoPlayer from './components/VideoPlayer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [url, setUrl] = useState('');
  const [viewLink, setViewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handlePasteClick = async () => {
    const text = await navigator.clipboard.readText();
    setUrl(text);
    toast.success('Pasted from clipboard.', { autoClose: 1500 });
  };

  const handleButtonClick = async () => {
    if(viewLink) {
      setViewLink('');
      setUrl('');
      return;
    }
    if (!url) {
      toast.error('Please enter a YouTube URL.');
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

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-900 text-white">
      <ToastContainer />
      
      <div className='flex flex-col justify-center items-center flex-grow m-2 mt-6 sm:mt-0'>
        <div className='flex flex-col justify-center items-center bg-primary text-white p-4 sm:p-8 min-h-96 mx-4 rounded-lg shadow-lg'>

          <h1 className="text-5xl font-bold text-red-500 mb-4">Kara
            <span className="text-slate-200">Change</span>
          </h1>
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
            <button onClick={handlePasteClick} className="ml-2 text-white">
              <Icon icon="akar-icons:clipboard" width={24} height={24} />
            </button>
          </div>
          {viewLink && <VideoPlayer viewLink={viewLink} />}

          {!loading && <button
            onClick={handleButtonClick}
            className="px-6 py-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition duration-300 mb-2 mt-2"
          >
            {!viewLink ? <span className='flex items-center gap-1'>Play <Icon icon="akar-icons:play" width={18} height={18} /></span> :
              <span className='flex items-center gap-1'>New Video <Icon icon="material-symbols:refresh-rounded" width={18} height={18} /></span>
            }
          </button>}
          {loading && (
            <div className="mt-4 w-64 sm:w-96  h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-loading-bar"></div>
            </div>
          )}
        </div>
      </div>
      <footer className="text-gray-400 text-center mt-8 p-4">
        <span className='underline-offset-2 underline' onClick={togglePopup}>Terms of Service</span>
        <p>
          Made with ❤️ by <a href="https://github.com/gabdevele" className="text-red-500 underline" target="_blank" rel="noreferrer">@gabdevele</a>
        </p>
      </footer>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 sm:p-8">
          <div className="bg-slate-100 text-black p-4 sm:p-8 rounded-lg shadow-lg max-w-lg w-full">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;