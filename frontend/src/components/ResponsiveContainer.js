import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';

export const RESPONSIVE_MAX_WIDTH = 480;

/**
 * Responsive container style object that can be reused directly in StyleSheets if needed.
 */
export const responsiveContainerStyle = {
  width: '100%',
  maxWidth: RESPONSIVE_MAX_WIDTH,
  alignSelf: 'center',
  ...(Platform.OS === 'web' ? { marginHorizontal: 'auto' } : {}),
};

/**
 * ResponsiveContainer
 *
 * Keeps desktop/web views centered with mobile proportions while ensuring
 * mobile displays continue stretching naturally to 100% width.
 *
 * Props:
 * - children: React.ReactNode
 * - maxWidth: number (default: 480)
 * - scrollable: boolean (default: false)
 * - card: boolean (default: false) - on web, adds subtle card framing
 * - style: ViewStyle
 * - contentContainerStyle: ViewStyle (used when scrollable is true)
 */
export default function ResponsiveContainer({
  children,
  maxWidth = RESPONSIVE_MAX_WIDTH,
  scrollable = false,
  card = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  ...rest
}) {
  const containerStyle = [
    styles.container,
    { maxWidth },
    card && Platform.OS === 'web' && styles.card,
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={[containerStyle, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={containerStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { marginHorizontal: 'auto' } : {}),
  },
  scrollWrapper: {
    width: '100%',
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    marginVertical: 24,
  },
});
