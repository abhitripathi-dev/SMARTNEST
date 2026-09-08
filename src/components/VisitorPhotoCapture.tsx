import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Trash2, X, FlipHorizontal, Check, AlertCircle } from 'lucide-react';

interface VisitorPhotoCaptureProps {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
}

export function VisitorPhotoCapture({ photoUrl, onPhotoChange }: VisitorPhotoCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  }, []);

  // Check for multi-cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start webcam
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please upload a photo instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Connect stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or upload a photo.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please upload a photo instead.');
      } else {
        setCameraError('Unable to access camera. Please upload a photo from your device.');
      }
      setIsCameraActive(false);
    }
  };

  // Switch front / rear camera
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(width, 480);
    canvas.height = Math.min(height, 480 * (height / width));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    onPhotoChange(dataUrl);
  };

  // Handle file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onPhotoChange(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="visitor-photo-wrapper">
      <div className="visitor-photo-header">
        <span className="photo-label">Visitor Photo (Optional)</span>
        {photoUrl && <span className="photo-status-badge"><Check size={12} /> Photo Attached</span>}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Camera error message */}
      {cameraError && (
        <div className="visitor-photo-error">
          <AlertCircle size={15} />
          <span>{cameraError}</span>
          <button type="button" onClick={() => setCameraError(null)} className="error-close-btn">
            <X size={13} />
          </button>
        </div>
      )}

      {/* State 1: Active Live Camera */}
      {isCameraActive ? (
        <div className="visitor-camera-box">
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`visitor-live-video ${facingMode === 'user' ? 'mirrored' : ''}`}
            />
            <div className="camera-face-guide">
              <div className="guide-oval" />
              <span className="guide-hint">Align face within frame</span>
            </div>
          </div>

          <div className="camera-control-bar">
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="camera-ctrl-btn flip-btn"
                title="Switch Camera"
              >
                <FlipHorizontal size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={capturePhoto}
              className="camera-capture-btn"
              title="Click to take photo"
            >
              <div className="capture-inner-dot" />
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="camera-ctrl-btn cancel-btn"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : photoUrl ? (
        /* State 2: Photo Preview Card */
        <div className="visitor-preview-card">
          <div className="visitor-preview-thumb-wrap">
            <img src={photoUrl} alt="Visitor Preview" className="visitor-preview-img" />
          </div>
          <div className="visitor-preview-actions">
            <button
              type="button"
              onClick={() => startCamera()}
              className="photo-action-btn retake-btn"
              title="Retake photo using webcam"
            >
              <RefreshCw size={14} /> Retake
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="photo-action-btn upload-again-btn"
              title="Upload different photo"
            >
              <Upload size={14} /> Change
            </button>
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="photo-action-btn remove-btn"
              title="Remove photo"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Initial Take / Upload Buttons */
        <div className="visitor-photo-choice-box">
          <button
            type="button"
            onClick={() => startCamera()}
            className="photo-choice-btn take-photo"
          >
            <Camera size={18} className="choice-icon" />
            <div className="choice-text">
              <strong>Take Photo</strong>
              <small>Use device camera</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="photo-choice-btn upload-photo"
          >
            <Upload size={18} className="choice-icon" />
            <div className="choice-text">
              <strong>Upload Photo</strong>
              <small>JPG, PNG up to 10MB</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
