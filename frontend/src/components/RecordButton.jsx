import { useState, useRef, useCallback } from 'react';

// 录音按钮组件
export default function RecordButton({ onStart, onStop, onData, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          if (onData) onData(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        if (onStop) onStop(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      // 计时器
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      if (onStart) onStart();

      // 最长录音15秒
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 15000);

    } catch (err) {
      console.error('无法访问麦克风:', err);
      alert('无法访问麦克风，请在设置中允许麦克风权限');
    }
  }, [onStart, onStop, onData]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
          isRecording
            ? 'bg-red-500 shadow-lg shadow-red-200 animate-pulse'
            : disabled
            ? 'bg-gray-300'
            : 'bg-indigo-600 shadow-lg shadow-indigo-200'
        }`}
      >
        <svg
          className={`w-8 h-8 text-white ${isRecording ? '' : 'ml-1'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {isRecording ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          )}
        </svg>
      </button>

      <div className="mt-2 text-sm text-gray-500">
        {isRecording ? (
          <span className="text-red-500 font-medium">
            🔴 录音中 {duration}s
          </span>
        ) : (
          <span>点击开始录音</span>
        )}
      </div>

      {isRecording && (
        <div className="mt-2 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-100"
            style={{ width: `${(duration / 15) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
