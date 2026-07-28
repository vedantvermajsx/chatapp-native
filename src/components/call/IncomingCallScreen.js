import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useCall } from '../../contexts/CallContext';
import { styles } from './styles';

export default function IncomingCallScreen() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;
  const caller = incomingCall.callerData;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={rejectCall}>
      <View style={styles.incomingBackdrop}>
        <View style={styles.incomingCard}>
          <View style={styles.incomingGlow} />
          <Avatar url={caller?.avatar} name={caller?.username} size={112} style={{ marginBottom: 20 }} />
          <Text style={styles.incomingName}>{caller?.username}</Text>
          <Text style={styles.incomingSub}>Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</Text>

          <View style={styles.incomingActions}>
            <View style={styles.incomingActionCol}>
              <TouchableOpacity style={styles.declineBtn} onPress={rejectCall}>
                <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.incomingActionLabel}>Decline</Text>
            </View>

            <View style={styles.incomingActionCol}>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
                <Ionicons name={incomingCall.isVideo ? 'videocam' : 'call'} size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.incomingActionLabel}>Accept</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
