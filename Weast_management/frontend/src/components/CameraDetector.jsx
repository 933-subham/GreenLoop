import React, { useRef, useEffect, useState } from 'react';
import { Camera, Upload, Volume2, ShieldAlert, UserCheck, RefreshCw, FileVideo, Film, Clock, VolumeX, BellRing } from 'lucide-react';

export default function CameraDetector({ binData, onDiscardManagement, setBinData }) {
  const videoRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const uploadedVideoRef = useRef(null);

  const [activeMode, setActiveMode] = useState('camera'); // 'camera' or 'video'
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Real-time AI response state from Python OpenCV
  const [aiAnnotatedImage, setAiAnnotatedImage] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({
    dustbin_detected: false,
    fill_percentage: 0,
    parts_filled: 0,
    total_parts: 4,
    status: 'NO_DUSTBIN_DETECTED',
    is_alert: false,
    verifying_sec: 0.0,
    dustbin_height_px: 0
  });

  // Video Upload State
  const [videoFile, setVideoFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [fps, setFps] = useState(10);
  const lastFrameTimeRef = useRef(Date.now());
  const audioCtxRef = useRef(null);

  // Initialize & Unlock Web Audio API on first user interaction
  const unlockAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioUnlocked(true);
    } catch (e) {
      console.warn("Audio unlock note:", e);
    }
  };

  useEffect(() => {
    const handleUserGesture = () => {
      unlockAudioContext();
    };
    window.addEventListener('click', handleUserGesture, { once: true });
    window.addEventListener('keydown', handleUserGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, []);

  // Audio Siren Alarm Sound Player (Dual-tone loud emergency alarm)
  const playSirenAlarm = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate 2 alternating high-pitched alarm tones
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      
      // Siren frequency sweep: 880Hz -> 1320Hz -> 880Hz
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1320, now + 0.15);
      osc.frequency.linearRampToValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio siren error:", e);
    }
  };

  // Start Browser Webcam Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Browser camera denied, switching to Python System Camera:", err);
      setCameraError("Switched to Python System Camera.");
      setCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeMode]);

  // Video File Handler
  const handleVideoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setUploadStatus(`Loading ${file.name}...`);

    try {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setUploadStatus(`Ready: ${file.name}`);

      if (uploadedVideoRef.current) {
        uploadedVideoRef.current.src = url;
        uploadedVideoRef.current.play().catch(err => console.log("Video play:", err));
      }
    } catch (err) {
      setUploadStatus(`Error loading video file: ${err.message}`);
    }
  };

  // Frame Processing Loop
  useEffect(() => {
    let intervalId;

    const captureAndSendFrame = async () => {
      if (isProcessingFrame) return;

      let frameTarget = null;
      if (activeMode === 'camera' && cameraActive) {
        frameTarget = videoRef.current;
      } else if (activeMode === 'video' && uploadedVideoRef.current) {
        frameTarget = uploadedVideoRef.current;
      }

      setIsProcessingFrame(true);

      try {
        let response;

        if (frameTarget && frameTarget.videoWidth > 0 && !frameTarget.paused && !frameTarget.ended) {
          const canvas = hiddenCanvasRef.current;
          if (canvas) {
            canvas.width = frameTarget.videoWidth || 640;
            canvas.height = frameTarget.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(frameTarget, 0, 0, canvas.width, canvas.height);
            const base64Image = canvas.toDataURL('image/jpeg', 0.65);

            response = await fetch('http://localhost:5000/api/detect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Image })
            });
          }
        } else if (activeMode === 'camera') {
          response = await fetch('http://localhost:5000/api/detect_system_cam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }

        if (response && response.ok) {
          const data = await response.json();
          if (data.annotated_image) {
            setAiAnnotatedImage(data.annotated_image);
          }
          if (data.analysis) {
            setAiAnalysis(data.analysis);

            const now = Date.now();
            const delta = (now - lastFrameTimeRef.current) / 1000;
            lastFrameTimeRef.current = now;
            if (delta > 0) setFps(Math.round(1 / delta));

            // Ring Siren Alarm whenever is_alert is true OR 4/4 parts full
            if (data.analysis.is_alert || (data.analysis.dustbin_detected && data.analysis.parts_filled >= 4)) {
              playSirenAlarm();
            }

            if (setBinData) {
              setBinData(prev => ({
                ...prev,
                fillPercentage: data.analysis.dustbin_detected ? data.analysis.fill_percentage : 0,
                status: data.analysis.status,
                logs: data.logs || prev.logs
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Python AI Backend error:", err);
      } finally {
        setIsProcessingFrame(false);
      }
    };

    intervalId = setInterval(captureAndSendFrame, 120); // ~8-10 FPS
    return () => clearInterval(intervalId);
  }, [activeMode, cameraActive, isProcessingFrame, soundEnabled]);

  const isAlarmTriggered = aiAnalysis.is_alert || (aiAnalysis.dustbin_detected && aiAnalysis.parts_filled >= 4);
  const isVerifying6s = !isAlarmTriggered && aiAnalysis.verifying_sec > 0;

  return (
    <div className="space-y-6">
      
      {/* 4-LAYER SUSTAINED ALARM BANNER */}
      {isAlarmTriggered && (
        <div className="alert-flash bg-red-600 text-white p-5 rounded-2xl shadow-2xl border-4 border-red-800 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ShieldAlert className="w-12 h-12 text-white animate-bounce flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-black tracking-wide uppercase">
                🚨 ALARM RINGING: DUSTBIN 100% FULL! (4/4 LAYERS)
              </h3>
              <p className="text-sm font-semibold text-red-100 mt-1">
                All 4 vertical layers inside the dustbin are completely filled. Disposal team alert triggered!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={playSirenAlarm}
              className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold text-xs rounded-lg border border-red-400 flex items-center space-x-1"
            >
              <BellRing className="w-4 h-4" />
              <span>Test Alarm Sound</span>
            </button>
            <button
              onClick={onDiscardManagement}
              className="px-6 py-3 bg-white text-red-700 hover:bg-red-50 font-black text-sm rounded-xl shadow-lg transition-transform transform active:scale-95"
            >
              🧹 Management Empty Dustbin
            </button>
          </div>
        </div>
      )}

      {/* 6-SECOND COUNTDOWN VERIFICATION BANNER */}
      {isVerifying6s && (
        <div className="bg-amber-500 text-white p-4 rounded-xl shadow-md border-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-white animate-spin" />
            <div>
              <h3 className="text-lg font-bold">
                ⏳ Verifying Layer 4 Full: {aiAnalysis.verifying_sec}s / 6.0s
              </h3>
              <p className="text-xs text-amber-100">
                Garbage reached Layer 4! Waiting 6 seconds to confirm before ringing alarm...
              </p>
            </div>
          </div>
          <div className="text-2xl font-black px-4 py-1.5 bg-amber-700 rounded-lg">
            {(6.0 - aiAnalysis.verifying_sec).toFixed(1)}s left
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border-2 border-green-600 shadow-md flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              activeMode === 'camera'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>📷 Mode 1: Direct Live Camera</span>
          </button>

          <button
            onClick={() => setActiveMode('video')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              activeMode === 'video'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>📹 Mode 2: Video File Upload</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              unlockAudioContext();
              playSirenAlarm();
            }}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 text-xs font-bold rounded-lg flex items-center space-x-1"
          >
            <BellRing className="w-4 h-4 text-amber-700" />
            <span>🔊 Test Alarm Sound</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border ${soundEnabled ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-600 border-red-300'}`}
            title="Toggle Alarm Tone"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Stream Output */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border-2 border-green-600 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>{activeMode === 'camera' ? '📷 Live AI Dustbin Detector' : '📹 Uploaded Video AI Detection'}</span>
            </h2>
            
            <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-400">
              4-Layer Full Alarm System
            </span>
          </div>

          <video ref={videoRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01 }} playsInline muted></video>
          <canvas ref={hiddenCanvasRef} className="hidden"></canvas>

          {activeMode === 'video' && (
            <div className="mb-4">
              <video
                ref={uploadedVideoRef}
                src={videoSrc || ''}
                controls
                playsInline
                loop
                muted
                className="w-full max-h-56 object-contain bg-black rounded-xl border-2 border-green-500 shadow-sm"
              ></video>
            </div>
          )}

          {/* Main Display Screen */}
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-800 bg-black flex justify-center items-center shadow-inner min-h-[420px]">
            {aiAnnotatedImage ? (
              <img
                src={aiAnnotatedImage}
                alt="Python AI Dustbin Detection Output"
                className="w-full h-auto object-contain max-h-[460px]"
              />
            ) : (
              <div className="text-center p-8 text-white">
                <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold">Initialising Python AI Detector...</p>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-gray-50 border border-green-500 rounded-lg">
              <span className="text-gray-500 block font-medium">Dustbin Detected</span>
              <span className={`text-xs font-bold ${aiAnalysis.dustbin_detected ? 'text-green-700' : 'text-amber-600'}`}>
                {aiAnalysis.dustbin_detected ? '✅ YES (MARKED)' : '❌ NO'}
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-green-500 rounded-lg">
              <span className="text-gray-500 block font-medium">6s Verification</span>
              <span className="text-xs font-bold text-amber-700">
                {isVerifying6s ? `${aiAnalysis.verifying_sec}s / 6.0s` : isAlarmTriggered ? '6.0s VERIFIED' : 'READY'}
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-green-500 rounded-lg">
              <span className="text-gray-500 block font-medium">Parts Filled</span>
              <span className="text-xs font-bold text-green-700">
                {aiAnalysis.dustbin_detected ? `${aiAnalysis.parts_filled}/4 Parts` : '0/4 Parts'}
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-green-500 rounded-lg">
              <span className="text-gray-500 block font-medium">Alarm Status</span>
              <span className={`text-xs font-bold ${isAlarmTriggered ? 'text-red-600 animate-pulse font-extrabold' : 'text-green-700'}`}>
                {isAlarmTriggered ? '🚨 ALARM RINGING!' : isVerifying6s ? '⏳ VERIFYING (6s)' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Video Uploader */}
          {activeMode === 'video' && (
            <div className="p-5 bg-white rounded-2xl border-2 border-green-600 shadow-md space-y-3">
              <div className="flex items-center space-x-2">
                <FileVideo className="w-5 h-5 text-green-600" />
                <h3 className="font-extrabold text-gray-900 text-sm">Select Video File</h3>
              </div>
              <label className="block w-full cursor-pointer">
                <div className="p-4 border-2 border-dashed border-green-600 hover:border-green-700 rounded-xl bg-green-50 text-center transition">
                  <Upload className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-green-800 block">Upload Video File (.mp4, .mov)</span>
                </div>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              {uploadStatus && <p className="text-xs font-bold text-green-800 bg-green-50 p-2 rounded">{uploadStatus}</p>}
            </div>
          )}

          {/* 4-Parts Fill Level Gauge */}
          <div className={`p-5 bg-white rounded-2xl border-2 shadow-md ${isAlarmTriggered ? 'border-red-600' : 'border-green-600'}`}>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Dustbin 4-Parts Fill Gauge</h3>
            <p className="text-xs text-gray-500 mb-3">Alarm rings when all 4 layers are full (100%)</p>

            <div className="flex items-baseline space-x-2 my-2">
              <span className={`text-5xl font-black ${
                isAlarmTriggered ? 'text-red-600 animate-pulse' : 
                aiAnalysis.parts_filled >= 2 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {aiAnalysis.dustbin_detected ? `${aiAnalysis.parts_filled * 25}%` : '0%'}
              </span>
              <span className="text-xs font-bold text-gray-500">
                {aiAnalysis.dustbin_detected ? `(${aiAnalysis.parts_filled}/4 Parts Filled)` : 'No Dustbin'}
              </span>
            </div>

            {/* 4 Section Vertical Meter */}
            <div className="space-y-1.5 my-4">
              {[4, 3, 2, 1].map((partNum) => {
                const isPartFilled = aiAnalysis.dustbin_detected && aiAnalysis.parts_filled >= partNum;
                return (
                  <div
                    key={partNum}
                    className={`p-2 rounded-lg border text-xs font-bold flex justify-between items-center transition-all ${
                      isPartFilled 
                        ? (partNum === 4 ? 'bg-red-500 text-white border-red-700' : partNum >= 2 ? 'bg-amber-400 text-gray-900 border-amber-500' : 'bg-green-500 text-white border-green-600')
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  >
                    <span>Layer {partNum} ({partNum * 25}% Height)</span>
                    <span>{isPartFilled ? (partNum === 4 && isVerifying6s ? `VERIFYING (${aiAnalysis.verifying_sec}s)` : 'FULL') : 'EMPTY'}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={onDiscardManagement}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>🧹 Management Empty Dustbin</span>
              </button>
            </div>
          </div>

          {/* Alarm Status Info Box */}
          <div className="p-5 bg-white rounded-2xl border-2 border-green-600 shadow-md">
            <h3 className="font-bold text-gray-900 text-sm mb-2">🚨 Audio Alarm Setup</h3>
            <p className="text-xs text-gray-600 mb-3">
              Modern browsers require 1 click on the page to unlock audio sound playback.
            </p>
            <button
              onClick={() => {
                unlockAudioContext();
                playSirenAlarm();
              }}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
            >
              <BellRing className="w-4 h-4" />
              <span>🔊 Enable / Test Audio Alarm Sound</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
