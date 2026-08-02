import React, { useEffect } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { showToast } from '../../utils/toast';
import { styles } from './styles';

export default function ChatVoiceRecorder({ onAudioReady, theme, isRecording, setIsRecording, onDurationChange }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 500);

  useEffect(() => {
    if (isRecording) {
      const sec = Math.floor((recorderState.durationMillis || 0) / 1000);
      onDurationChange?.(sec);
    } else {
      onDurationChange?.(0);
    }
  }, [recorderState.durationMillis, isRecording, onDurationChange]);

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        const durationSec = Math.round((recorderState.durationMillis || 0) / 1000);
        await recorder.stop();
        const uri = recorder.uri;
        setIsRecording(false);
        if (uri && onAudioReady) {
          onAudioReady({
            uri,
            mimeType: 'audio/m4a',
            fileName: 'voice-message.m4a',
            duration: durationSec,
          });
        }
      } catch (err) {
        setIsRecording(false);
        showToast(err?.message || 'Could not save recording');
      }
      return;
    }

    try {
      const perm = await getRecordingPermissionsAsync();
      let granted = perm.granted;
      if (!granted) {
        const newPerm = await requestRecordingPermissionsAsync();
        granted = newPerm.granted;
      }
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow microphone access to record a voice message.');
        return;
      }
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Could not access microphone.');
    }
  };

  return (
    <TouchableOpacity onPress={toggleRecording} style={styles.pillIconBtn}>
      {isRecording ? (
        <Ionicons name="square" size={20} color="#ef4444" />
      ) : (
        <Ionicons name="mic-outline" size={22} color={theme.otherUsernameColor} />
      )}
    </TouchableOpacity>
  );
}
