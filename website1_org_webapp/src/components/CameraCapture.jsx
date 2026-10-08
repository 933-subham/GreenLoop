import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Camera, RotateCcw, X, CheckCircle } from 'lucide-react';

/**
 * CameraCapture – Forces real-time camera capture (no gallery).
 *
 * Props:
 *  onCapture(file, previewUrl)  – called when user confirms the snap
 *  onClear()                    – called when user discards the captured photo
 *  previewUrl                   – existing preview (controlled)
 *  label                        – optional extra label text
 */
export default function CameraCapture({ onCapture, onClear, previewUrl, label }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [mode, setMode] = useState('idle');
    const [facingMode, setFacingMode] = useState('environment');
    const [cameraError, setCameraError] = useState('');
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (previewUrl && mode === 'idle') setMode('preview');
        if (!previewUrl && mode === 'preview') setMode('idle');
    }, [previewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async (facing = facingMode) => {
        setCameraError('');
        setStarting(true);
        stopStream();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setMode('viewfinder');
        } catch (err) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found on this device.');
            } else {
                setCameraError('Camera error: ' + err.message);
            }
            setMode('idle');
        } finally {
            setStarting(false);
        }
    }, [facingMode, stopStream]);

    const flipCamera = useCallback(() => {
        const next = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(next);
        startCamera(next);
    }, [facingMode, startCamera]);

    const snap = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            if (!blob) return;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], 'garbage-report-' + timestamp + '.jpg', { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            stopStream();
            setMode('preview');
            onCapture(file, url);
        }, 'image/jpeg', 0.92);
    }, [stopStream, onCapture]);

    const retake = useCallback(() => {
        onClear();
        setMode('idle');
    }, [onClear]);

    useEffect(() => () => stopStream(), [stopStream]);

    if (mode === 'idle') {
        return (
            <div>
                <div
                    className="upload-zone"
                    style={{ cursor: starting ? 'default' : 'pointer' }}
                    onClick={() => !starting && startCamera()}
                >
                    {starting
                        ? <><Spinner size="sm" animation="border" className="me-2" />Starting camera...</>
                        : <>
                            <Camera size={36} className="text-muted mb-2" />
                            <p className="mb-0 fw-semibold text-muted">Tap to Open Camera</p>
                            <p className="mb-0 small text-muted" style={{ fontSize: '0.78rem' }}>
                                📸 Real-time snapshot only — no gallery upload
                                {label && <><br />{label}</>}
                            </p>
                        </>
                    }
                </div>
                {cameraError && (
                    <p className="text-danger small mt-2">⚠️ {cameraError}</p>
                )}
                <canvas ref={canvasRef} className="d-none" />
            </div>
        );
    }

    if (mode === 'viewfinder') {
        return (
            <div className="position-relative" style={{ borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                />
                <div className="position-absolute top-0 end-0 m-2 d-flex gap-2">
                    <Button
                        size="sm"
                        variant="dark"
                        className="rounded-pill px-3 opacity-75"
                        onClick={flipCamera}
                        title="Flip camera"
                    >
                        <RotateCcw size={14} /> Flip
                    </Button>
                    <Button
                        size="sm"
                        variant="dark"
                        className="opacity-75"
                        style={{ borderRadius: '50%', width: 32, height: 32, padding: 0 }}
                        onClick={() => { stopStream(); setMode('idle'); }}
                        title="Close camera"
                    >
                        <X size={14} />
                    </Button>
                </div>
                <span
                    className="position-absolute top-0 start-0 m-2 badge"
                    style={{ background: 'rgba(220,53,69,0.85)', fontSize: '0.7rem', borderRadius: 6 }}
                >
                    ● LIVE
                </span>
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
                    <button
                        onClick={snap}
                        style={{
                            width: 64, height: 64,
                            borderRadius: '50%',
                            border: '4px solid white',
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(4px)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Take photo"
                    >
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white' }} />
                    </button>
                </div>
                <canvas ref={canvasRef} className="d-none" />
            </div>
        );
    }

    return (
        <div className="position-relative">
            <img
                src={previewUrl}
                alt="Captured photo"
                className="w-100 rounded-3"
                style={{ maxHeight: 220, objectFit: 'cover', display: 'block' }}
            />
            <Button
                size="sm"
                variant="light"
                className="position-absolute top-0 end-0 m-2 border d-flex align-items-center gap-1"
                onClick={retake}
            >
                <RotateCcw size={13} /> Retake
            </Button>
            <span
                className="position-absolute bottom-0 start-0 m-2 badge bg-success d-flex align-items-center gap-1"
                style={{ fontSize: '0.72rem' }}
            >
                <CheckCircle size={12} /> Photo captured
            </span>
        </div>
    );
}
