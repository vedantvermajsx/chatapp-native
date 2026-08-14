import { useRef } from 'react';
import { Animated, Pressable, Vibration } from 'react-native';

const RELEASE_ANIM_DURATION = 150;

// Wraps `children` in a Pressable that gives a small, building "press"
// animation (slight shrink + dim) for the duration of the hold
export function LongPressFeedback({
  children,
  onLongPress,
  delayLongPress = 350,
  disabled = false,
  vibrate = true,
  style,
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue, duration) => {
    Animated.timing(pressAnim, { toValue, duration, useNativeDriver: true }).start();
  };

  const handlePressIn = () => {
    if (disabled) return;
    animateTo(1, delayLongPress);
  };

  const handlePressOut = () => {
    if (disabled) return;
    animateTo(0, RELEASE_ANIM_DURATION);
  };

  const handleLongPress = (event) => {
    if (disabled) return;
    if (vibrate) Vibration.vibrate(10);
    animateTo(0, RELEASE_ANIM_DURATION);
    onLongPress?.(event);
  };

  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  const opacity = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={disabled ? undefined : handleLongPress}
      delayLongPress={delayLongPress}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
