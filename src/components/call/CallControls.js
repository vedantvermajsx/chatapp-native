import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../contexts/CallContext';
import { styles } from './styles';

export default function CallControls({ isVideo }) {
  const { endCall, isMuted, isVideoOff, toggleMute, toggleVideo } = useCall();

  return (
    <View style={styles.bar}>
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
        <TouchableOpacity
          style={[styles.btn, isVideoOff && styles.btnActive]}
          onPress={toggleVideo}
        >
          <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#f87171' : '#fff'} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 50 }} />
      )}
    </View>
  );
}
