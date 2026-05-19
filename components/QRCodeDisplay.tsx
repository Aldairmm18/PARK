import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/colors';

interface Props {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 220 }: Props) {
  return (
    <View style={[styles.container, { padding: 16 }]}>
      <QRCode
        value={value || 'PARKNOW'}
        size={size}
        color="#000"
        backgroundColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
