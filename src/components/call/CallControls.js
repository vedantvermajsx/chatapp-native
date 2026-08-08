import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../contexts/CallContext';
import { styles } from './styles';

export default function CallControls({ isVideo }) {
  const { endCall, isMuted, isVideoOff, isSpeakerOn, toggleMute, toggleVideo, toggleSpeaker, switchCamera } = useCall();

  return (
    <View style={styles.bar}>
      <View style={styles.btnCol}>
        <TouchableOpacity
          style={[styles.btn, isSpeakerOn && styles.btnEnabled]}
          onPress={toggleSpeaker}
          activeOpacity={0.7}
        >
          <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={22} color={isSpeakerOn ? '#60a5fa' : '#fff'} />
        </TouchableOpacity>
        <Text style={styles.btnLabel}>Speaker</Text>
      </View>

      <View style={styles.btnCol}>
        <TouchableOpacity
          style={[styles.btn, isMuted && styles.btnActive]}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#f87171' : '#fff'} />
        </TouchableOpacity>
        <Text style={styles.btnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
      </View>

      <View style={styles.btnCol}>
        <TouchableOpacity style={styles.endBtn} onPress={endCall} activeOpacity={0.8}>
          <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.btnLabel}>End</Text>
      </View>

      {isVideo ? (
        <>
          <View style={styles.btnCol}>
            <TouchableOpacity
              style={[styles.btn, isVideoOff && styles.btnActive]}
              onPress={toggleVideo}
              activeOpacity={0.7}
            >
              <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#f87171' : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>{isVideoOff ? 'Start' : 'Stop'} Video</Text>
          </View>

          <View style={styles.btnCol}>
            <TouchableOpacity style={styles.btn} onPress={switchCamera} disabled={isVideoOff} activeOpacity={0.7}>
              <Ionicons name="camera-reverse" size={22} color={isVideoOff ? 'rgba(255,255,255,0.3)' : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>Flip</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}