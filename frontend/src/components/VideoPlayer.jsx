import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  HiOutlinePlayCircle, HiOutlinePauseCircle, HiOutlineSpeakerWave, HiOutlineSpeakerXMark,
  HiOutlineArrowsPointingOut, HiOutlineArrowsPointingIn, HiOutlineCog6Tooth,
} from 'react-icons/hi2';

export default function VideoPlayer({ url, poster, onError, autoplay = true }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initPlayer = useCallback(() => {
    if (!url || !videoRef.current) return;
    setLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
        enableWorker: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLoading(false);
        const levels = data.levels.map((level, i) => ({
          id: i,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}k`,
        }));
        setQualities(levels);
        if (autoplay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false);
          setError('Stream unavailable');
          onError?.('Stream error');
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 3000);
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (autoplay) video.play().catch(() => {});
      });
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => {
        setLoading(false);
        if (autoplay) video.play().catch(() => {});
      });
    }

    video.volume = volume / 100;
  }, [url, autoplay, volume, onError]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const handleKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(100, v + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 10));
          break;
        case 'Escape':
          if (fullscreen) toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleQualityChange = (level) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
    setCurrentQuality(level);
    setShowQualityMenu(false);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <p className="text-red-400 font-medium mb-2">{error}</p>
            <button onClick={initPlayer} className="btn-primary text-sm">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
              {playing ? <HiOutlinePauseCircle className="w-8 h-8" /> : <HiOutlinePlayCircle className="w-8 h-8" />}
            </button>

            {/* Live Badge */}
            <span className="badge badge-live animate-pulse">● LIVE</span>

            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-primary-400 transition-colors">
                {muted || volume === 0 ? <HiOutlineSpeakerXMark className="w-5 h-5" /> : <HiOutlineSpeakerWave className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                className="w-20 h-1 bg-surface-600 rounded-full appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Quality */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 text-white hover:text-primary-400 transition-colors"
                >
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                  <span className="text-xs">{currentQuality >= 0 ? qualities[currentQuality]?.label : 'Auto'}</span>
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-surface-900/95 backdrop-blur-xl rounded-xl border border-surface-700/50 py-2 min-w-[120px] animate-scale-in">
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-800 transition-colors ${currentQuality === -1 ? 'text-primary-400' : 'text-white'}`}
                    >
                      Auto
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQualityChange(q.id)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-800 transition-colors ${currentQuality === q.id ? 'text-primary-400' : 'text-white'}`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition-colors">
              {fullscreen ? <HiOutlineArrowsPointingIn className="w-5 h-5" /> : <HiOutlineArrowsPointingOut className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
