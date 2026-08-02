import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../contexts/CallContext';
import { styles } from './styles';

export default function CallControls({ isVideo }) {
  const { endCall, isMuted, isVideoOff, isSpeakerOn, toggleMute, toggleVideo, toggleSpeaker, switchCamera } = useCall();

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={[styles.btn, isSpeakerOn && styles.btnEnabled]}
        onPress={toggleSpeaker}
      >
        <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={22} color={isSpeakerOn ? '#60a5fa' : '#fff'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, isMuted && styles.btnActive]}
        onPress={toggleMute}
      >
        <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#f87171' : '#fff'} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.endBtn} onPress={endCall}>
        <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>

      {isVideo ? (
        <>
          <TouchableOpacity
            style={[styles.btn, isVideoOff && styles.btnActive]}
            onPress={toggleVideo}
          >
            <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#f87171' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={switchCamera} disabled={isVideoOff}>
            <Ionicons name="camera-reverse" size={22} color={isVideoOff ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{ width: 50 }} />
          <View style={{ width: 50 }} />
        </>
      )}
    </View>
  );
}