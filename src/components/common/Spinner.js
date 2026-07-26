import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Spinner({ size = 'small', color = '#9ca3af', style }) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
