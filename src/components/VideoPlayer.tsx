import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import * as Tone from 'tone';

interface VideoPlayerProps {
  viewLink: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ viewLink }) => {
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const grainPlayerRef = useRef<Tone.GrainPlayer | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (viewLink && videoRef.current) {
      connectAudioToTone(videoRef.current, grainPlayerRef);
    }
  }, [viewLink]);

  useEffect(() => {
    const handleMouseActivity = () => {
      setControlsVisible(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 5000);
    };

    document.addEventListener('mousemove', handleMouseActivity);
    document.addEventListener('keydown', handleMouseActivity);

    handleMouseActivity();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      document.removeEventListener('mousemove', handleMouseActivity);
      document.removeEventListener('keydown', handleMouseActivity);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            handlePlayPause();
            break;
          case 'm':
            e.preventDefault();
            handleMute();
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleSeekBy(5);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handleSeekBy(-5);
            break;
          default:
            break;
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isMuted, currentTime]);

  useEffect(() => {
    const handleVideoEnd = () => {
      setIsEnded(true);
      if (grainPlayerRef.current) {
        grainPlayerRef.current.stop();
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('ended', handleVideoEnd);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', handleVideoEnd);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (grainPlayerRef.current) {
        grainPlayerRef.current.stop();
        grainPlayerRef.current.disconnect();
      }
    };
  }, []);

  const handlePitchChange = (steps: number) => {
    const newPitch = Math.max(-7, Math.min(7, pitch + steps));
    if (grainPlayerRef.current) {
      grainPlayerRef.current.detune = newPitch * 100;
    }
    setPitch(newPitch);
  };

  const handleTempoChange = (factor: number) => {
    const newTempo = Math.max(0.5, Math.min(2, tempo + factor));
    if (grainPlayerRef.current && videoRef.current) {
      grainPlayerRef.current.playbackRate = newTempo;
      videoRef.current.playbackRate = newTempo;
    }
    setTempo(newTempo);
  };

  const connectAudioToTone = async (video: HTMLVideoElement, grainPlayerRef: React.MutableRefObject<Tone.GrainPlayer | null>) => {
    await Tone.start();
    if (grainPlayerRef.current) {
      grainPlayerRef.current.stop();
      grainPlayerRef.current.disconnect();
    }
    const grainPlayer = new Tone.GrainPlayer(video.src).toDestination();
    grainPlayer.loop = true;
    grainPlayer.volume.value = volume;
    grainPlayer.playbackRate = tempo;
    grainPlayerRef.current = grainPlayer;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (grainPlayerRef.current) {
      grainPlayerRef.current.volume.value = newVolume;
      grainPlayerRef.current.mute = newVolume === -40;
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current && grainPlayerRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        grainPlayerRef.current.stop();
      } else {
        videoRef.current.play();
        if (currentTime > 0) grainPlayerRef.current.start("0", currentTime);
        else grainPlayerRef.current.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current && grainPlayerRef.current) {
      videoRef.current.muted = !isMuted;
      grainPlayerRef.current.mute = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeekBy = (seconds: number) => {
    if (videoRef.current && grainPlayerRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      grainPlayerRef.current.stop();
      grainPlayerRef.current.start("0", newTime);
      setCurrentTime(newTime);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current && grainPlayerRef.current) {
      videoRef.current.currentTime = newTime;
      grainPlayerRef.current.stop();
      if(isPlaying) grainPlayerRef.current.start("0", newTime);
      setCurrentTime(newTime);
    }
  };

  const handleFullScreen = () => {
    if (playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    if (videoRef.current && grainPlayerRef.current) {
      videoRef.current.currentTime = 0;
      grainPlayerRef.current.stop();
      setCurrentTime(0);
      setIsEnded(false);
      handlePlayPause();
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className="relative rounded-lg overflow-hidden m-4 h-52 w-72 sm:h-64 sm:w-auto sm:aspect-video bg-black flex justify-center items-center"
    >
      <video
        src={viewLink}
        controls={false}
        muted
        className="h-full object-cover rounded-lg"
        ref={videoRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-3 flex justify-between items-center ${
          controlsVisible ? 'controls-visible' : 'controls-hidden'
        }`}
      >
        <button onClick={isEnded ? handleRefresh : handlePlayPause} className="text-white">
          <Icon icon={isEnded ? 'mdi:refresh' : isPlaying ? 'iconoir:pause-solid' : 'mage:play-fill'} width={24} height={24} />
        </button>
        <input
          type="range"
          min="0"
          max={videoRef.current?.duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="flex-grow mx-2 accent-red-500"
        />
        <div className="flex items-center mx-2">
          <button onClick={handleMute} className="text-white">
            <Icon
              icon={isMuted ? 'akar-icons:sound-off' : 'akar-icons:sound-on'}
              width={24}
              height={24}
              className="text-white mr-2"
            />
          </button>
          <input
            type="range"
            min="-40"
            max="0"
            step="1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 hidden sm:block accent-red-500"
          />
        </div>
        <button className="text-white" onClick={handleFullScreen}>
          <Icon icon="mdi:fullscreen" width={24} height={24} />
        </button>
      </div>
      <div
        className={`flex items-center flex-col absolute right-0 top-1 sm:top-1/3 mr-3 bg-black bg-opacity-90 p-2 rounded-lg ${
          controlsVisible ? 'controls-visible' : 'controls-hidden'
        }`}
      >
        <span className="text-white mx-2">Key</span>
        <div className="flex items-center">
          <button onClick={() => handlePitchChange(-1)} className="text-white">
            <Icon icon="typcn:minus" width={24} height={24} />
          </button>
          <span className="text-white mx-2 min-w-5 text-center">{pitch}</span>
          <button onClick={() => handlePitchChange(1)} className="text-white">
            <Icon icon="typcn:plus" width={24} height={24} />
          </button>
        </div>
        <span className="text-white mx-2">Tempo</span>
        <div className="flex items-center">
          <button onClick={() => handleTempoChange(-0.1)} className="text-white">
            <Icon icon="typcn:minus" width={24} height={24} />
          </button>
          <span className="text-white mx-2 min-w-5 text-center">{tempo.toFixed(1)}x</span>
          <button onClick={() => handleTempoChange(0.1)} className="text-white">
            <Icon icon="typcn:plus" width={24} height={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;