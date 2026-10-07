import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CameraCapture({ onCapture, onClear, imageUri, label }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color="#10b981" /></View>;
  }

  const handleOpenLiveCamera = async () => {
    if (!permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission Needed', 'Please allow camera access to take real-time unfiltered garbage photos.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const takeSnapshot = async () => {
    if (cameraRef.current && !snapping) {
      setSnapping(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        setCameraOpen(false);
        setSnapping(false);
        if (photo?.uri) {
          onCapture(photo.uri);
        }
      } catch (err) {
        setSnapping(false);
        Alert.alert('Snap Error', 'Could not capture photo: ' + err.message);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // 1. Live Camera Viewfinder Modal/Overlay
  if (cameraOpen) {
    return (
      <View style={styles.viewfinderContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Top Bar */}
          <View style={styles.topControls}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE CAMERA ONLY</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.iconCircle} onPress={toggleCameraFacing}>
                <MaterialCommunityIcons name="camera-flip" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setCameraOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Shutter Controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.helperText}>Real-time unfiltered photo required</Text>
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={takeSnapshot}
              disabled={snapping}
              activeOpacity={0.7}
            >
              {snapping ? (
                <ActivityIndicator color="#10b981" size="large" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // 2. Photo Preview state
  if (imageUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
        <View style={styles.previewOverlay}>
          <View style={styles.capturedBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
            <Text style={styles.capturedText}>Live Photo Captured</Text>
          </View>
          <TouchableOpacity style={styles.retakeBtn} onPress={onClear}>
            <MaterialCommunityIcons name="camera-retake" size={18} color="#ef4444" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Idle Tap to Open Camera state (No gallery access allowed)
  return (
    <TouchableOpacity style={styles.uploadZone} onPress={handleOpenLiveCamera} activeOpacity={0.8}>
      <View style={styles.cameraIconWrap}>
        <MaterialCommunityIcons name="camera" size={38} color="#10b981" />
      </View>
      <Text style={styles.uploadTitle}>Tap to Open Live Camera</Text>
      <Text style={styles.uploadSubtitle}>
        📸 Real-time snapshot only — gallery uploads disabled to ensure authentic reporting
      </Text>
      {label ? <Text style={styles.optionalLabel}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  uploadZone: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  optionalLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
  },
  viewfinderContainer: {
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  helperText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  previewOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  capturedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});
