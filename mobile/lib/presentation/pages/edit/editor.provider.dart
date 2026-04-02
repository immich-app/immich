import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/utils/editor.utils.dart';

final editorStateProvider = NotifierProvider<EditorProvider, EditorState>(EditorProvider.new);

class EditorProvider extends Notifier<EditorState> {
  @override
  EditorState build() {
    return const EditorState();
  }

  void clear() {
    state = const EditorState();
  }

  void init(List<AssetEdit> edits, ExifInfo exifInfo) {
    clear();

    final existingCrop = edits.whereType<CropEdit>().firstOrNull;

    final originalWidth = exifInfo.isFlipped ? exifInfo.height : exifInfo.width;
    final originalHeight = exifInfo.isFlipped ? exifInfo.width : exifInfo.height;

    Rect crop = existingCrop != null && originalWidth != null && originalHeight != null
        ? convertCropParametersToRect(existingCrop.parameters, originalWidth, originalHeight)
        : const Rect.fromLTRB(0, 0, 1, 1);

    final transform = normalizeTransformEdits(edits);

    state = state.copyWith(
      originalWidth: originalWidth,
      originalHeight: originalHeight,
      crop: crop,
      flipHorizontal: transform.mirrorHorizontal,
      flipVertical: transform.mirrorVertical,
    );

    _animateRotation(transform.rotation.toInt(), duration: Duration.zero);
  }

  void _animateRotation(int angle, {Duration duration = const Duration(milliseconds: 300)}) {
    state = state.copyWith(rotationAngle: angle, animationDuration: duration);
  }

  void normalizeRotation() {
    final normalizedAngle = ((state.rotationAngle % 360) + 360) % 360;
    if (normalizedAngle != state.rotationAngle) {
      state = state.copyWith(rotationAngle: normalizedAngle, animationDuration: Duration.zero);
    }
  }

  void setIsEditing(bool isApplyingEdits) {
    state = state.copyWith(isApplyingEdits: isApplyingEdits);
  }

  void setCrop(Rect crop) {
    state = state.copyWith(crop: crop, hasUnsavedEdits: true);
  }

  void setAspectRatio(double? aspectRatio) {
    if (aspectRatio != null && state.rotationAngle % 180 != 0) {
      // When rotated 90 or 270 degrees, swap width and height for aspect ratio calculations
      aspectRatio = 1 / aspectRatio;
    }

    state = state.copyWith(aspectRatio: aspectRatio);
  }

  void resetEdits() {
    _animateRotation(0);

    state = state.copyWith(
      flipHorizontal: false,
      flipVertical: false,
      crop: const Rect.fromLTRB(0, 0, 1, 1),
      aspectRatio: null,
      hasUnsavedEdits: true,
    );
  }

  void rotateCCW() {
    _animateRotation(state.rotationAngle - 90);
    state = state.copyWith(hasUnsavedEdits: true);
  }

  void rotateCW() {
    _animateRotation(state.rotationAngle + 90);
    state = state.copyWith(hasUnsavedEdits: true);
  }

  void flipHorizontally() {
    if (state.rotationAngle % 180 != 0) {
      // When rotated 90 or 270 degrees, flipping horizontally is equivalent to flipping vertically
      state = state.copyWith(flipVertical: !state.flipVertical, hasUnsavedEdits: true);
    } else {
      state = state.copyWith(flipHorizontal: !state.flipHorizontal, hasUnsavedEdits: true);
    }
  }

  void flipVertically() {
    if (state.rotationAngle % 180 != 0) {
      // When rotated 90 or 270 degrees, flipping vertically is equivalent to flipping horizontally
      state = state.copyWith(flipHorizontal: !state.flipHorizontal, hasUnsavedEdits: true);
    } else {
      state = state.copyWith(flipVertical: !state.flipVertical, hasUnsavedEdits: true);
    }
  }
}

class EditorState {
  final bool isApplyingEdits;

  final int rotationAngle;
  final bool flipHorizontal;
  final bool flipVertical;
  final Rect crop;
  final double? aspectRatio;

  final int originalWidth;
  final int originalHeight;

  final Duration animationDuration;

  final bool hasUnsavedEdits;

  const EditorState({
    bool? isApplyingEdits,
    int? rotationAngle,
    bool? flipHorizontal,
    bool? flipVertical,
    Rect? crop,
    this.aspectRatio,
    int? originalWidth,
    int? originalHeight,
    Duration? animationDuration,
    bool? hasUnsavedEdits,
  }) : isApplyingEdits = isApplyingEdits ?? false,
       rotationAngle = rotationAngle ?? 0,
       flipHorizontal = flipHorizontal ?? false,
       flipVertical = flipVertical ?? false,
       animationDuration = animationDuration ?? Duration.zero,
       originalWidth = originalWidth ?? 0,
       originalHeight = originalHeight ?? 0,
       crop = crop ?? const Rect.fromLTRB(0, 0, 1, 1),
       hasUnsavedEdits = hasUnsavedEdits ?? false;

  EditorState copyWith({
    bool? isApplyingEdits,
    int? rotationAngle,
    bool? flipHorizontal,
    bool? flipVertical,
    double? aspectRatio,
    int? originalWidth,
    int? originalHeight,
    Duration? animationDuration,
    Rect? crop,
    bool? hasUnsavedEdits,
  }) {
    return EditorState(
      isApplyingEdits: isApplyingEdits ?? this.isApplyingEdits,
      rotationAngle: rotationAngle ?? this.rotationAngle,
      flipHorizontal: flipHorizontal ?? this.flipHorizontal,
      flipVertical: flipVertical ?? this.flipVertical,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      animationDuration: animationDuration ?? this.animationDuration,
      originalWidth: originalWidth ?? this.originalWidth,
      originalHeight: originalHeight ?? this.originalHeight,
      crop: crop ?? this.crop,
      hasUnsavedEdits: hasUnsavedEdits ?? this.hasUnsavedEdits,
    );
  }

  bool get hasEdits {
    return rotationAngle != 0 || flipHorizontal || flipVertical || crop != const Rect.fromLTRB(0, 0, 1, 1);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is EditorState &&
        other.isApplyingEdits == isApplyingEdits &&
        other.rotationAngle == rotationAngle &&
        other.flipHorizontal == flipHorizontal &&
        other.flipVertical == flipVertical &&
        other.crop == crop &&
        other.aspectRatio == aspectRatio &&
        other.originalWidth == originalWidth &&
        other.originalHeight == originalHeight &&
        other.animationDuration == animationDuration &&
        other.hasUnsavedEdits == hasUnsavedEdits;
  }

  @override
  int get hashCode {
    return isApplyingEdits.hashCode ^
        rotationAngle.hashCode ^
        flipHorizontal.hashCode ^
        flipVertical.hashCode ^
        crop.hashCode ^
        aspectRatio.hashCode ^
        originalWidth.hashCode ^
        originalHeight.hashCode ^
        animationDuration.hashCode ^
        hasUnsavedEdits.hashCode;
  }
}
