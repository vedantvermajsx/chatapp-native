import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AppSplashScreen() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../../../assets/splash.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
    backgroundColor: '#000000',
    zIndex: 999,
    elevation: 999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
