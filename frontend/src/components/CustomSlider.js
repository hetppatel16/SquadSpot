import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';

/**
 * CustomSlider
 *
 * Smooth, cross-platform slider that works seamlessly across Web and Mobile (Expo Go).
 * Provides glowing accent aesthetics matching the SquadSpot design system.
 */
export default function CustomSlider({
  value = 4,
  min = 1,
  max = 12,
  step = 1,
  onValueChange,
  trackHeight = 6,
  thumbSize = 20,
  activeColor = '#0df269',
  inactiveColor = 'rgba(255, 255, 255, 0.15)',
  ticks = [1, 4, 12],
  tickLabels,
  style,
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startRatioRef = useRef(0);
  const currentValueRef = useRef(value);
  currentValueRef.current = value;

  const clamp = (val, low, high) => Math.min(Math.max(val, low), high);

  const calculateSteppedValue = (ratio) => {
    const rawVal = min + ratio * (max - min);
    const stepped = Math.round((rawVal - min) / step) * step + min;
    return clamp(stepped, min, max);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        const locX = evt.nativeEvent.locationX;
        const tapRatio = clamp(locX / width, 0, 1);
        const nextVal = calculateSteppedValue(tapRatio);
        startRatioRef.current = (nextVal - min) / (max - min);

        if (onValueChange && nextVal !== currentValueRef.current) {
          onValueChange(nextVal);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        const deltaRatio = gestureState.dx / width;
        const currentRatio = clamp(startRatioRef.current + deltaRatio, 0, 1);
        const nextVal = calculateSteppedValue(currentRatio);

        if (onValueChange && nextVal !== currentValueRef.current) {
          onValueChange(nextVal);
        }
      },
      onPanResponderRelease: () => {
        startRatioRef.current = (currentValueRef.current - min) / (max - min);
      },
      onPanResponderTerminate: () => {
        startRatioRef.current = (currentValueRef.current - min) / (max - min);
      },
    })
  ).current;

  const percentage = clamp((value - min) / (max - min), 0, 1);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Slider Interactive Area */}
      <View
        style={[styles.touchArea, { height: Math.max(thumbSize + 12, 36) }]}
        {...panResponder.panHandlers}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
      >
        {/* Background Inactive Track */}
        <View
          style={[
            styles.baseTrack,
            {
              height: trackHeight,
              borderRadius: trackHeight / 2,
              backgroundColor: inactiveColor,
            },
          ]}
        >
          {/* Active Filled Track */}
          <View
            style={[
              styles.activeTrack,
              {
                width: `${percentage * 100}%`,
                height: trackHeight,
                borderRadius: trackHeight / 2,
                backgroundColor: activeColor,
              },
            ]}
          />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: activeColor,
              left: `${percentage * 100}%`,
              marginLeft: -thumbSize / 2,
            },
          ]}
        />
      </View>

      {/* Optional Tick Markers / Labels */}
      {ticks && ticks.length > 0 && (
        <View style={styles.ticksContainer}>
          {ticks.map((tick, index) => {
            const tickRatio = clamp((tick - min) / (max - min), 0, 1);
            const label = tickLabels && tickLabels[index] ? tickLabels[index] : `${tick}h`;
            return (
              <View
                key={tick}
                style={[
                  styles.tickWrapper,
                  index === 0 && { alignItems: 'flex-start' },
                  index === ticks.length - 1 && { alignItems: 'flex-end' },
                  index > 0 && index < ticks.length - 1 && { alignItems: 'center' },
                ]}
              >
                <Text style={styles.tickText}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 2,
  },
  touchArea: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
  baseTrack: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  activeTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#0df269',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(13, 242, 105, 0.7)' } : {}),
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  tickWrapper: {
    flex: 1,
  },
  tickText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '600',
  },
});
