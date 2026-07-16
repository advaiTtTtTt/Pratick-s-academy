'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function ProtectedVideoPlayer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(`https://img.youtube.com/vi/${getYouTubeId(url)}/maxresdefault.jpg`);

  const videoId = getYouTubeId(url);

  useEffect(() => {
    if (!videoId) return;

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (playerRef.current || !containerRef.current) return;
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0, // Hide YouTube controls
          disablekb: 1, // Disable keyboard shortcuts
          fs: 0, // Disable fullscreen button
          modestbranding: 1, // Hide YouTube logo (mostly)
          rel: 0, // Don't show related videos from others
          showinfo: 0, // Hide video title
          iv_load_policy: 3, // Hide annotations
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
               setIsPlaying(true);
               setHasStarted(true);
               setIsBuffering(false);
            } else if (state === window.YT.PlayerState.PAUSED) {
               setIsPlaying(false);
               setIsBuffering(false);
            } else if (state === window.YT.PlayerState.BUFFERING) {
               setIsBuffering(true);
            } else if (state === window.YT.PlayerState.ENDED) {
               setIsPlaying(false);
            }
          }
        }
      });
    }

    return () => {
      // Destroy player on unmount to fix React Strict Mode double-mount state bugs
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Update progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          setProgress(playerRef.current.getCurrentTime());
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!videoId) {
    return (
      <div className="bg-slate-800 rounded-2xl aspect-video flex items-center justify-center border border-slate-700/50">
        <p className="text-slate-400">Invalid or missing YouTube URL</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black group shadow-2xl border border-slate-800">
      
      {/* 1. The actual YouTube iframe wrapper */}
      <div className="relative pt-[56.25%] pointer-events-none bg-black">
         {/* Scale up to 1.35x to completely push YouTube's top title and bottom logo out of the visible container */}
         <div ref={containerRef} className="absolute inset-0 w-full h-full scale-[1.35] origin-center opacity-90"></div>
      </div>
      
      {/* 2. Custom Thumbnail Layer (Hides the initial YouTube Title) */}
      {!hasStarted && (
        <div className="absolute inset-0 z-20 bg-slate-900 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={thumbUrl} 
            alt="Video Thumbnail"
            onError={() => setThumbUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}
            className="w-full h-full object-cover opacity-80"
          />
          {/* Big Custom Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)] transform group-hover:scale-110 transition-transform duration-300">
               <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pause Blur Layer (Hides YouTube title when paused) */}
      {hasStarted && !isPlaying && (
        <div className="absolute inset-0 z-15 bg-slate-900/30 backdrop-blur-md flex items-center justify-center transition-all duration-300 pointer-events-none">
          <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-xl">
             <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}
      
      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
           <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 4. Custom Watermark (Hides the bottom-right YouTube logo watermark) */}
      {hasStarted && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-2 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Victory Education" className="h-4 w-auto brightness-200" />
          <span className="text-white/80 text-[10px] font-semibold tracking-wider">VICTORY</span>
        </div>
      )}

      {/* 5. Click Capture Layer (Invisible, captures all clicks to prevent YouTube interactions) */}
      <div 
        className="absolute inset-0 z-30 cursor-pointer" 
        onClick={togglePlay}
        onContextMenu={(e) => {
          e.preventDefault(); // Block right click
          return false;
        }}
      ></div>

      {/* 6. Custom Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-40 transition-opacity duration-300 flex flex-col gap-2 pointer-events-none ${hasStarted ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={togglePlay}
            className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
          >
            {isPlaying ? (
               <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
               <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <div className="flex-1 flex items-center gap-3">
            <span className="text-white text-sm font-medium w-12 text-right drop-shadow-md">{formatTime(progress)}</span>
            
            {/* Custom Range Slider */}
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress} 
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-600/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
            
            <span className="text-white text-sm font-medium w-12 drop-shadow-md">{formatTime(duration)}</span>
          </div>

          {/* Settings Menu (Speed) */}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="text-white/80 hover:text-white transition-colors focus:outline-none flex items-center gap-1 font-medium text-sm drop-shadow-md bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {playbackRate}x
            </button>
            
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">Speed</div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={(e) => { e.stopPropagation(); changeSpeed(rate); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${playbackRate === rate ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-200 hover:bg-white/10'}`}
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
