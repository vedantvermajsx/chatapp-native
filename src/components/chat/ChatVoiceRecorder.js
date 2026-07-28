import React, { useRef } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';



export default function ChatVoiceRecorder({ onAudioReady, theme, isRecording, setIsRecording }) {
  const recordingRef = useRef(null);

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        const recording = recordingRef.current;
        recordingRef.current = null;
        await recording?.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recording?.getURI();
        setIsRecording(false);
        if (uri && onAudioReady) {
          onAudioReady({
            uri,
            mimeType: 'audio/m4a',
            fileName: 'voice-message.m4a',
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
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
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
