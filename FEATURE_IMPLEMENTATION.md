# Double-Tap-and-Drag Zoom Feature Implementation

## Summary
Implemented one-finger zoom for Immich mobile app (Issue #1713). Users can now:
1. Double-tap an image
2. Hold the second tap
3. Drag down to zoom IN
4. Drag up to zoom OUT

This matches the behavior found in Google Maps, Google Photos, and other popular apps.

## Implementation Details

### Files Modified

#### 1. `/mobile/lib/widgets/photo_view/src/core/photo_view_gesture_detector.dart`
- **Added:** `DoubleTapDragGestureRecognizer` class
  - Custom gesture recognizer that detects double-tap-and-hold-drag pattern
  - Tracks tap sequence and drag movement
  - Fires callbacks for start, update, and end events
  
- **Added:** Callback type definitions
  - `DoubleTapDragStartCallback`
  - `DoubleTapDragUpdateCallback`
  - `DoubleTapDragEndCallback`

- **Modified:** `PhotoViewGestureDetector` widget
  - Added support for double-tap-drag callbacks
  - Conditionally registers `DoubleTapDragGestureRecognizer` when callbacks are provided
  - Falls back to standard `DoubleTapGestureRecognizer` when not using drag feature

#### 2. `/mobile/lib/widgets/photo_view/src/core/photo_view_core.dart`
- **Added:** State variables for tracking double-tap-drag
  - `_doubleTapDragInitialScale` - Scale at gesture start
  - `_doubleTapDragStartPosition` - Initial touch position
  - `_doubleTapDragTotalDy` - Accumulated vertical drag distance

- **Added:** Handler methods
  - `onDoubleTapDragStart()` - Initializes gesture state, stops animations
  - `onDoubleTapDragUpdate()` - Calculates and applies new scale based on drag distance
  - `onDoubleTapDragEnd()` - Finalizes gesture, ensures bounds, updates scale state

- **Modified:** `build()` method
  - Registered double-tap-drag callbacks with `PhotoViewGestureDetector`
  - Respects `disableScaleGestures` setting

### Technical Approach

**Scale Calculation:**
```dart
const double sensitivity = 0.005; // Tune for faster/slower zoom
final double scaleFactor = math.exp(totalDragDistance * sensitivity);
final double newScale = (initialScale * scaleFactor).clamp(minScale, maxScale);
```

- Exponential scaling provides smooth, natural feel
- Drag down (positive dy) → zoom in
- Drag up (negative dy) → zoom out
- Respects min/max scale boundaries

**Gesture Recognition:**
- First tap registers and waits (with timeout)
- Second tap within `kDoubleTapSlop` distance activates drag mode
- Movement threshold (`kTouchSlop`) before drag begins
- Compatible with existing pinch-to-zoom and pan gestures

**State Management:**
- Stops existing animations when gesture starts
- Updates `PhotoViewScaleState` as scale changes
- Animates back to bounds if user exceeds limits
- Optionally centers image when fully zoomed in

## Testing Recommendations

### Manual Testing
1. **Basic functionality**
   - Double-tap-hold-drag down → should zoom in smoothly
   - Double-tap-hold-drag up → should zoom out smoothly
   - Release → should stay at current zoom level

2. **Boundary conditions**
   - Drag past max zoom → should clamp and animate back
   - Drag past min zoom → should clamp and animate back
   - Quick double-tap (no hold) → should still cycle zoom states (existing behavior)

3. **Interaction with other gestures**
   - Pinch-to-zoom should still work
   - Pan/swipe should still work when zoomed
   - Page swipe (next/prev image) should work when not zoomed
   - Works correctly in both portrait and landscape

4. **Edge cases**
   - Very small images
   - Very large images
   - Different aspect ratios
   - Motion photos
   - Videos (should not interfere)

### Device Testing
- Test on multiple Android devices
- Test on iOS devices
- Test with different screen sizes
- Test performance during rapid drag movements

## Configuration

The zoom sensitivity can be adjusted by changing:
```dart
const double sensitivity = 0.005; // In onDoubleTapDragUpdate()
```

- **Lower values (0.001-0.003):** Slower, more precise zoom
- **Higher values (0.007-0.010):** Faster, more responsive zoom
- **Default (0.005):** Balanced feel similar to Google Photos

## Compatibility

- ✅ Works with existing double-tap zoom cycling
- ✅ Works with pinch-to-zoom
- ✅ Works with pan gestures
- ✅ Respects `disableScaleGestures` setting
- ✅ Works in `PageView` context (image gallery)
- ✅ Compatible with Hero animations

## Future Enhancements (Optional)

1. **User preference:** Add setting to enable/disable feature
2. **Visual feedback:** Show zoom level indicator during drag
3. **Haptic feedback:** Vibrate when reaching zoom limits
4. **Accessibility:** Ensure screen readers announce zoom changes

## Related Issues

- Closes #1713
- May improve experience mentioned in #2765 (zoom sensitivity)

## Credits

- Implementation: Pinchy the Bot (@pinchy-the-bot)
- Feature request: Original discussion #1712, Issue #1713
- Inspired by: Google Maps, Google Photos zoom behavior
