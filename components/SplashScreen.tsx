// components/SplashScreen.tsx
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon.png')} // Your app logo
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7500fc', // Or your brand color
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
  },
});