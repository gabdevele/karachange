import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [key, setKey] = useState(0);
  const [detectedKey, setDetectedKey] = useState(null);
  
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const pitchNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handlePasteClick = async () => {
    const text = await navigator.clipboard.readText();
    setUrl(text);
  };

  const handleCancelClick = () => {
    setUrl('');
  };

  const handleButtonClick = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.viewLink) {
        setVideos([...videos, data.viewLink]);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('An error occurred while fetching the video link.');
    } finally {
      setLoading(false);
    }
  };

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const createPitchShifterNode = async (audioContext) => {
    const bufferSize = 4096;
    const node = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    let inputBuffer = new Float32Array(bufferSize);
    let outputBuffer = new Float32Array(bufferSize);
    let grainWindow = new Float32Array(bufferSize);
    
    // Create Hanning window
    for (let i = 0; i < bufferSize; i++) {
      grainWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / bufferSize));
    }

    node.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const outputData = e.outputBuffer.getChannelData(0);
      
      // Copy input
      inputData.forEach((sample, i) => {
        inputBuffer[i] = sample;
      });

      // Apply pitch shift
      const pitchRatio = Math.pow(2, key / 12);
      const numSamples = Math.round(bufferSize / pitchRatio);
      
      // Time-domain pitch shifting
      for (let i = 0; i < bufferSize; i++) {
        const index = Math.floor(i * pitchRatio);
        if (index < bufferSize) {
          outputBuffer[i] = inputBuffer[index];
        } else {
          outputBuffer[i] = 0;
        }
      }

      // Apply window and copy to output
      outputBuffer.forEach((sample, i) => {
        outputData[i] = sample * grainWindow[i];
      });
    };

    return node;
  };

  const detectKey = (analyser) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(dataArray);

    // Find dominant frequency
    let maxIndex = 0;
    let maxValue = -Infinity;
    
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    const frequency = maxIndex * audioContextRef.current.sampleRate / (2 * bufferLength);
    
    // Convert frequency to musical note
    const noteNumber = 12 * Math.log2(frequency / 440) + 69;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = notes[Math.round(noteNumber) % 12];
    
    setDetectedKey(note);
  };

  const handleVideoLoaded = async () => {
    if (!videoRef.current) return;

    const audioContext = setupAudioContext();
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }

    sourceNodeRef.current = audioContext.createMediaElementSource(videoRef.current);
    pitchNodeRef.current = await createPitchShifterNode(audioContext);
    analyserRef.current = audioContext.createAnalyser();

    // Connect nodes
    sourceNodeRef.current
      .connect(pitchNodeRef.current)
      .connect(analyserRef.current)
      .connect(audioContext.destination);

    // Start key detection
    setInterval(() => detectKey(analyserRef.current), 1000);
  };

  // Rest of your component code remains the same
  // (handleInputChange, handlePasteClick, handleCancelClick, handleButtonClick, handleKeyChange)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white">
      <h1 className="text-5xl font-bold text-red-500 mb-4">YTPitch</h1>
      <p className="text-xl text-gray-400 mb-8 text-center">
        Transform your YouTube karaoke experience! Adjust the key effortlessly without any extensions or downloads.
      </p>

      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={handleInputChange}
          className="px-4 py-2 w-96 bg-stone-800 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        />
        <button onClick={handlePasteClick} className="ml-2 text-white">
          <Icon icon="akar-icons:clipboard" width={24} height={24} />
        </button>
        <button onClick={handleCancelClick} className="ml-2 text-white">
          <Icon icon="akar-icons:close" width={24} height={24} />
        </button>
      </div>

      <button
        onClick={handleButtonClick}
        className="px-6 py-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition duration-300 mb-4"
      >
        Pitch It!
      </button>

      {loading && (
        <div className="mt-4 w-96 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 animate-loading-bar"></div>
        </div>
      )}

      {videos.map((video, index) => (
        <div key={index} className="mt-4 w-full flex flex-col items-center">
          <video
            src={video}
            controls
            className="w-96 mb-4"
            ref={videoRef}
            onLoadedMetadata={handleVideoLoaded}
            crossOrigin="anonymous"
          />
          <div className="flex space-x-4">
            <label className="text-white">Key (Current: {detectedKey || 'N/A'}):</label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={key}
              onChange={handleKeyChange}
              className="w-48"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;