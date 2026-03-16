# Double-Tap-and-Drag Zoom Implementation Plan

## Overview
Implement the "double-tap, hold second tap, drag to zoom" gesture for Immich mobile app (Issue #1713).

## Current State
- PhotoView uses `DoubleTapGestureRecognizer` which only triggers on double-tap completion
- Current double-tap cycles through fixed zoom states (initial → zoomed → covering)
- No continuous zoom control during double-tap-hold

## Implementation Approach

### 1. Custom Gesture Recognizer
Create a `DoubleTapDragGestureRecognizer` that:
- Detects first tap
- Detects second tap **down** (not up)
- Tracks drag movement while second tap is held
- Converts vertical drag distance to scale changes

### 2. Integration Points
- **File:** `photo_view_gesture_detector.dart`
  - Add the new gesture recognizer alongside existing ones
  - Handle gesture conflicts properly
  
- **File:** `photo_view_core.dart`
  - Add state tracking for double-tap-drag mode
  - Add handler methods for the new gesture events
  - Calculate scale from drag distance

### 3. Gesture Behavior
- **Drag down:** Zoom IN (increase scale)
- **Drag up:** Zoom OUT (decrease scale)
- **Scale calculation:** Logarithmic or exponential for smooth feel
- **Constraints:** Respect min/max scale boundaries

### 4. Conflict Resolution
- Disable regular double-tap zoom when double-tap-drag is active
- Don't interfere with pinch-to-zoom
- Work alongside pan gestures

## Files to Modify

1. `/mobile/lib/widgets/photo_view/src/core/photo_view_gesture_detector.dart`
   - Add `DoubleTapDragGestureRecognizer` class
   - Register it in `PhotoViewGestureDetector`

2. `/mobile/lib/widgets/photo_view/src/core/photo_view_core.dart`
   - Add double-tap-drag state management
   - Add handler methods
   - Integrate with existing scale system

## Testing Strategy
1. Test basic double-tap-drag functionality
2. Test with min/max scale boundaries
3. Test interaction with other gestures (pan, pinch, page swipe)
4. Test on different image sizes
5. Test performance during dragging

## Next Steps
1. ✅ Analyze codebase
2. → Implement `DoubleTapDragGestureRecognizer`
3. → Integrate with PhotoViewCore
4. → Test and refine
5. → Submit PR
