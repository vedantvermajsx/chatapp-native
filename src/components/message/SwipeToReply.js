import { useRef } from 'react';
import { View, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const SWIPE_TRIGGER = 56;
const MAX_SWIPE = 76;

export function SwipeToReply({ children, onReply, disabled, isOwn }) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const triggeredRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        if (disabled) return false;
        if (isOwn ? gesture.dx >= 0 : gesture.dx <= 0) return false;
        return Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
      },
      onPanResponderGrant: () => {
        triggeredRef.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        const dx = isOwn
          ? Math.max(-MAX_SWIPE, Math.min(gesture.dx, 0))
          : Math.max(0, Math.min(gesture.dx, MAX_SWIPE));
        translateX.setValue(dx);
        iconOpacity.setValue(Math.min(1, Math.abs(dx) / SWIPE_TRIGGER));
        if (Math.abs(dx) >= SWIPE_TRIGGER && !triggeredRef.current) {
          triggeredRef.current = true;
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = isOwn ? Math.min(0, gesture.dx) : Math.max(0, gesture.dx);
        if (Math.abs(dx) >= SWIPE_TRIGGER) {
          onReply?.();
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
        Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
        Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={{ width: '100%' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            opacity: iconOpacity,
          },
          isOwn ? { right: 8 } : { left: 8 },
        ]}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.isLight ? '#e5e7eb' : '#374151',
          }}
        >
          <Ionicons name="arrow-undo-outline" size={16} color={theme.otherUsernameColor} />
        </View>
      </Animated.View>

      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
        {children}
      </Animated.View>
    </View>
  );
}