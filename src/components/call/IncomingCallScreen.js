import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useCall } from '../../contexts/CallContext';
import { styles } from './styles';

export default function IncomingCallScreen() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!incomingCall) return;
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [incomingCall, enter, pulse]);

  if (!incomingCall) return null;
  const caller = incomingCall.callerData;
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  return (
    <Modal visible animationType="fade" transparent onRequestClose={rejectCall}>
      <View style={styles.incomingBackdrop}>
        <Animated.View
          style={[
            styles.incomingCard,
            { opacity: enter, transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
          ]}
        >
          <Animated.View style={[styles.incomingGlow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
          <Avatar url={caller?.avatar} name={caller?.username} size={112} style={{ marginBottom: 20 }} />
          <Text style={styles.incomingName}>{caller?.username}</Text>
          <Text style={styles.incomingSub}>Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</Text>

          <View style={styles.incomingActions}>
            <View style={styles.incomingActionCol}>
              <TouchableOpacity style={styles.declineBtn} onPress={rejectCall} activeOpacity={0.8}>
                <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.incomingActionLabel}>Decline</Text>
            </View>

            <View style={styles.incomingActionCol}>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall} activeOpacity={0.8}>
                <Ionicons name={incomingCall.isVideo ? 'videocam' : 'call'} size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.incomingActionLabel}>Accept</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
