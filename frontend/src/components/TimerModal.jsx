import { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, StopIcon } from './Icons';

export default function TimerModal({ onStop }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex justify-center items-center p-4 bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Timer Running</h2>
        <div className="text-6xl font-mono bg-slate-100 p-4 rounded-lg mb-6 tracking-wider">
          {formatTime(elapsedSeconds)}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-lg font-medium text-white rounded-lg shadow-md transition-transform hover:scale-105 ${isPaused ? 'bg-sky-500 hover:bg-sky-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg font-medium text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-transform hover:scale-105"
          >
            <StopIcon /> Stop
          </button>
        </div>
      </div>
    </div>
  );
}
