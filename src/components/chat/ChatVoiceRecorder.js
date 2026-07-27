import React, { useRef } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// How many bars the waveform preview should have. We sample metering on an
// interval while recording and bucket it down to this many bars.
const WAVEFORM_BARS = 40;

export default function ChatVoiceRecorder({ onAudioReady, theme, isRecording, setIsRecording }) {
  const recordingRef = useRef(null);
  const meteringRef = useRef([]);
  const meterIntervalRef = useRef(null);
  const startedAtRef = useRef(0);

  const stopMetering = () => {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        stopMetering();
        const recording = recordingRef.current;
        recordingRef.current = null;
        await recording?.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recording?.getURI();
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        setIsRecording(false);
        if (uri && onAudioReady) {
          onAudioReady({
            uri,
            mimeType: 'audio/m4a',
            fileName: 'voice-message.m4a',
            duration: durationSec,
            waveform: bucketWaveform(meteringRef.current, WAVEFORM_BARS),
          });
        }
      } catch (err) {
        setIsRecording(false);
      }
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow microphone access to record a voice message.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
        null,
        100 // metering update interval (ms)
      );
      recordingRef.current = recording;
      meteringRef.current = [];
      startedAtRef.current = Date.now();
      setIsRecording(true);

      meterIntervalRef.current = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status?.isRecording && typeof status.metering === 'number') {
            // metering is in dBFS, roughly -160 (silence) to 0 (max).
            // Normalize to 0..1 for bar heights.
            const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            meteringRef.current.push(normalized);
          }
        } catch {}
      }, 100);
    } catch (err) {
      Alert.alert('Error', 'Could not access microphone.');
    }
  };

  return (
    <TouchableOpacity onPress={toggleRecording} style={{ paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
      {isRecording ? (
        <Ionicons name="square" size={20} color="#ef4444" />
      ) : (
        <Ionicons name="mic-outline" size={22} color={theme.otherUsernameColor} />
      )}
    </TouchableOpacity>
  );
}

// Downsample/bucket the raw metering samples into a fixed number of bars,
// averaging each bucket so the waveform is stable regardless of recording length.
function bucketWaveform(samples, barCount) {
  if (!samples.length) return new Array(barCount).fill(0.15);
  const bucketSize = Math.max(1, Math.ceil(samples.length / barCount));
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const chunk = samples.slice(i * bucketSize, (i + 1) * bucketSize);
    if (!chunk.length) {
      bars.push(bars[bars.length - 1] || 0.15);
      continue;
    }
    const avg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
    bars.push(Math.max(0.12, avg));
  }
  return bars;
}
