import { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import { toast } from 'react-toastify';
import { API_URL, DOWNLOAD_ENDPOINT, SEARCH_ENDPOINT } from '../config';

const MainCard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [viewLink, setViewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  interface Video {
    thumbnail: string;
    title: string;
    url: string;
  }

  const [searchResults, setSearchResults] = useState<Video[]>([]);

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast.success('Pasted from clipboard.', { autoClose: 1500 });
    } catch (error) {
      toast.error('Failed to read from clipboard.', { autoClose: 1500 });
    }
  };

  const handlePlayClick = async () => {
    if (!url) {
      if (!errorShown) {
        toast.error('Please enter a YouTube URL.');
        setErrorShown(true);
        setTimeout(() => setErrorShown(false), 3000);
      }
      return;
    }
    setLoading(true);
    setSearchResults([]); // Clear search results when playing a video
    try {
      const response = await fetch(`${API_URL}${DOWNLOAD_ENDPOINT}?url=${encodeURIComponent(url)}`);
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

  const handleSearchClick = async () => {
    if (!url) {
      if (!errorShown) {
        toast.error('Please enter a search query.');
        setErrorShown(true);
        setTimeout(() => setErrorShown(false), 3000);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}${SEARCH_ENDPOINT}?query=${encodeURIComponent(url)}`);
      const data = await response.json();
      setSearchResults(data.videos);
    } catch (error) {
      console.error("Error while fetching search results: ", error);
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

  const handleVideoSelect = (videoUrl: string) => {
    setUrl(videoUrl);
    setSelectedVideo(videoUrl);
  };

  return (
    <motion.div 
      className='flex flex-col justify-center items-center bg-primary text-white p-4 sm:p-8 min-h-96 mx-4 rounded-lg shadow-lg'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.h1 className="text-5xl font-bold text-red-500 mb-4 shine">
        Kara
        <span className="text-slate-200">Change</span>
      </motion.h1>
      <p className="text-md sm:text-lg text-gray-400 mb-8 text-center">
        Change your karaoke experience! <br />
        Adjust key and tempo effortlessly without any extensions or downloads.
      </p>
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Paste a YouTube URL or search for a song"
          value={url}
          onChange={handleInputChange}
          className="px-4 py-2 w-64 sm:w-96 bg-stone-800 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
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
      {searchResults.length > 0 && (
        <div className="search-results flex flex-col gap-2 mt-4 w-full max-w-md mx-auto">
          {searchResults.map((video, index) => (
            <div 
              key={index} 
              className={`video-result  p-2 rounded-lg shadow-lg flex items-center justify-between cursor-pointer ${selectedVideo === video.url ? 'bg-red-500' : 'bg-stone-800'}`}
              onClick={() => handleVideoSelect(video.url)}
            >
              <div className="flex items-center">
                <img src={video.thumbnail} alt={video.title} className="w-16 h-16 rounded-lg mr-2" />
                <span className="text-white text-sm ">
                  {video.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && (
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.85 }}
            onClick={handlePlayClick}
            className="px-6 py-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition duration-300 mb-2 mt-2"
            disabled={!url}
          >
            <span className='flex items-center gap-1'>Play <Icon icon="akar-icons:play" width={18} height={18} /></span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleSearchClick}
            className="px-6 py-3 text-white rounded-full shadow-lg transition duration-300 mb-2 mt-2"
            style={{ backgroundColor: 'rgb(105, 81, 81)' }}
            disabled={!url}
          >
            <span className='flex items-center gap-1'>Search <Icon icon="akar-icons:search" width={18} height={18} /></span>
          </motion.button>
        </div>
      )}
      {loading && (
        <div className="mt-4 w-64 sm:w-96 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 animate-loading-bar"></div>
        </div>
      )}
    </motion.div>
  );
};

export default MainCard;