import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/aspect_ratios.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/theme/theme_data.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:openapi/api.dart' show RotateParameters, MirrorParameters, MirrorAxis;

@RoutePage()
class DriftEditImagePage extends ConsumerStatefulWidget {
  final Image image;
  final List<AssetEdit> edits;
  final ExifInfo exifInfo;
  final Future<void> Function(List<AssetEdit> edits) applyEdits;

  const DriftEditImagePage({
    super.key,
    required this.image,
    required this.edits,
    required this.exifInfo,
    required this.applyEdits,
  });

  @override
  ConsumerState<DriftEditImagePage> createState() => _DriftEditImagePageState();
}

class _DriftEditImagePageState extends ConsumerState<DriftEditImagePage> with TickerProviderStateMixin {
  late final CropController cropController;

  Duration _rotationAnimationDuration = const Duration(milliseconds: 0);

  int _rotationAngle = 0;
  bool _flipHorizontal = false;
  bool _flipVertical = false;
  double? _aspectRatio;

  late final originalWidth = widget.exifInfo.isFlipped ? widget.exifInfo.height : widget.exifInfo.width;
  late final originalHeight = widget.exifInfo.isFlipped ? widget.exifInfo.width : widget.exifInfo.height;

  bool _isApplyingEdits = false;
  bool _hasSheetChanges = false;
  late final Rect _initialCrop;

  void initEditor() {
    final existingCrop = widget.edits.whereType<CropEdit>().firstOrNull;

    Rect crop = existingCrop != null && originalWidth != null && originalHeight != null
        ? convertCropParametersToRect(existingCrop.parameters, originalWidth!, originalHeight!)
        : const Rect.fromLTRB(0, 0, 1, 1);

    cropController = CropController(defaultCrop: crop);

    final transform = normalizeTransformEdits(widget.edits);
    _rotationAngle = transform.rotation.toInt();

    _flipHorizontal = transform.mirrorHorizontal;
    _flipVertical = transform.mirrorVertical;

    _initialCrop = cropController.crop;
  }

  bool get hasUnsavedChanges {
    final isCropChanged = cropController.crop != _initialCrop;
    return isCropChanged || _hasSheetChanges;
  }

  Future<void> _saveEditedImage() async {
    setState(() {
      _isApplyingEdits = true;
    });

    final cropParameters = convertRectToCropParameters(cropController.crop, originalWidth ?? 0, originalHeight ?? 0);
    final normalizedRotation = (_rotationAngle % 360 + 360) % 360;
    final edits = <AssetEdit>[];

    if (cropParameters.width != originalWidth || cropParameters.height != originalHeight) {
      edits.add(CropEdit(cropParameters));
    }

    if (_flipHorizontal) {
      edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)));
    }

    if (_flipVertical) {
      edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)));
    }

    if (normalizedRotation != 0) {
      edits.add(RotateEdit(RotateParameters(angle: normalizedRotation)));
    }

    await widget.applyEdits(edits);

    setState(() {
      _isApplyingEdits = false;
    });
  }

  @override
  void initState() {
    super.initState();
    initEditor();
  }

  @override
  void dispose() {
    cropController.dispose();
    super.dispose();
  }

  void _rotateLeft() {
    setState(() {
      _rotationAnimationDuration = const Duration(milliseconds: 250);
      _rotationAngle -= 90;
      _hasSheetChanges = true;
    });
  }

  void _rotateRight() {
    setState(() {
      _rotationAnimationDuration = const Duration(milliseconds: 250);
      _rotationAngle += 90;
      _hasSheetChanges = true;
    });
  }

  void _flipHorizontally() {
    setState(() {
      if (_rotationAngle % 180 != 0) {
        // When rotated 90 or 270 degrees, flipping horizontally is equivalent to flipping vertically
        _flipVertical = !_flipVertical;
      } else {
        _flipHorizontal = !_flipHorizontal;
      }
      _hasSheetChanges = true;
    });
  }

  void _flipVertically() {
    setState(() {
      if (_rotationAngle % 180 != 0) {
        // When rotated 90 or 270 degrees, flipping vertically is equivalent to flipping horizontally
        _flipHorizontal = !_flipHorizontal;
      } else {
        _flipVertical = !_flipVertical;
      }
      _hasSheetChanges = true;
    });
  }

  void _applyAspectRatio(double? ratio) {
    setState(() {
      if (ratio != null && _rotationAngle % 180 != 0) {
        // When rotated 90 or 270 degrees, swap width and height for aspect ratio calculations
        ratio = 1 / ratio!;
      }

      cropController.aspectRatio = ratio;
      _aspectRatio = ratio;
    });
  }

  void _resetEdits() {
    setState(() {
      cropController.aspectRatio = null;
      cropController.crop = const Rect.fromLTRB(0, 0, 1, 1);
      _rotationAnimationDuration = const Duration(milliseconds: 250);
      _rotationAngle = 0;
      _flipHorizontal = false;
      _flipVertical = false;
      _aspectRatio = null;
    });
  }

  bool get hasEdits {
    final isCropped = cropController.crop != const Rect.fromLTRB(0, 0, 1, 1);
    final isRotated = (_rotationAngle % 360 + 360) % 360 != 0;
    final isFlipped = _flipHorizontal || _flipVertical;

    return isCropped || isRotated || isFlipped;
  }

  Future<bool?> _showDiscardChangesDialog() {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('editor_discard_edits_title'.tr()),
        content: Text('editor_discard_edits_prompt'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            style: ButtonStyle(
              foregroundColor: WidgetStateProperty.all(context.themeData.colorScheme.onSurfaceVariant),
            ),
            child: Text('cancel'.tr()),
          ),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: Text('confirm'.tr())),
        ],
      ),
    );
  }

  Future<void> _handleClose() async {
    if (hasUnsavedChanges) {
      final shouldDiscard = await _showDiscardChangesDialog() ?? false;
      if (shouldDiscard && mounted) {
        Navigator.of(context).pop();
      }
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldDiscard = await _showDiscardChangesDialog() ?? false;
        if (shouldDiscard && mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Theme(
        data: getThemeData(colorScheme: ref.watch(immichThemeProvider).dark, locale: context.locale),
        child: Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.black,
            title: Text("edit".tr()),
            leading: ImmichCloseButton(onPressed: _handleClose),
            actions: [
              _isApplyingEdits
                  ? const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2.5)),
                    )
                  : ImmichIconButton(
                      icon: Icons.done_rounded,
                      color: ImmichColor.primary,
                      variant: ImmichVariant.ghost,
                      onPressed: _saveEditedImage,
                    ),
            ],
          ),
          backgroundColor: Colors.black,
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                Expanded(
                  child: LayoutBuilder(
                    builder: (BuildContext context, BoxConstraints constraints) {
                      // Calculate the bounding box size needed for the rotated container
                      final baseWidth = constraints.maxWidth * 0.9;
                      final baseHeight = constraints.maxHeight * 0.95;

                      return Center(
                        child: AnimatedRotation(
                          turns: _rotationAngle / 360,
                          duration: _rotationAnimationDuration,
                          curve: Curves.easeInOut,
                          child: Transform(
                            alignment: Alignment.center,
                            transform: Matrix4.identity()
                              ..scaleByDouble(_flipHorizontal ? -1.0 : 1.0, _flipVertical ? -1.0 : 1.0, 1.0, 1.0),
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              width: (_rotationAngle % 180 == 0) ? baseWidth : baseHeight,
                              height: (_rotationAngle % 180 == 0) ? baseHeight : baseWidth,
                              child: CropImage(
                                controller: cropController,
                                image: widget.image,
                                gridColor: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeInOut,
                  alignment: Alignment.bottomCenter,
                  clipBehavior: Clip.none,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: ref.watch(immichThemeProvider).dark.surface,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _TransformControls(
                          onRotateLeft: _rotateLeft,
                          onRotateRight: _rotateRight,
                          onFlipHorizontal: _flipHorizontally,
                          onFlipVertical: _flipVertically,
                          onAspectRatioSelected: _applyAspectRatio,
                          aspectRatio: _aspectRatio,
                        ),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 36, left: 24, right: 24),
                          child: Row(
                            children: [
                              const Spacer(),
                              ImmichTextButton(
                                labelText: 'reset'.tr(),
                                onPressed: _resetEdits,
                                variant: ImmichVariant.ghost,
                                expanded: false,
                                disabled: !hasEdits,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AspectRatioButton extends StatelessWidget {
  final AspectRatioPreset ratio;
  final bool isSelected;
  final VoidCallback onPressed;

  const _AspectRatioButton({required this.ratio, required this.isSelected, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.max,
      children: [
        IconButton(
          iconSize: 36,
          icon: Transform.rotate(
            angle: ratio.iconRotated ? pi / 2 : 0,
            child: Icon(ratio.icon, color: isSelected ? context.primaryColor : context.themeData.iconTheme.color),
          ),
          onPressed: onPressed,
        ),
        Text(ratio.label, style: context.textTheme.displayMedium),
      ],
    );
  }
}

class _AspectRatioSelector extends StatelessWidget {
  final double? currentAspectRatio;
  final void Function(double?) onAspectRatioSelected;

  const _AspectRatioSelector({required this.currentAspectRatio, required this.onAspectRatioSelected});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: aspectRatios.map((entry) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: _AspectRatioButton(
              ratio: entry,
              isSelected: currentAspectRatio == entry.ratio,
              onPressed: () => onAspectRatioSelected(entry.ratio),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _TransformControls extends StatelessWidget {
  final VoidCallback onRotateLeft;
  final VoidCallback onRotateRight;
  final VoidCallback onFlipHorizontal;
  final VoidCallback onFlipVertical;
  final void Function(double?) onAspectRatioSelected;
  final double? aspectRatio;

  const _TransformControls({
    required this.onRotateLeft,
    required this.onRotateRight,
    required this.onFlipHorizontal,
    required this.onFlipVertical,
    required this.onAspectRatioSelected,
    required this.aspectRatio,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  ImmichIconButton(
                    icon: Icons.rotate_left,
                    variant: ImmichVariant.ghost,
                    color: ImmichColor.secondary,
                    onPressed: onRotateLeft,
                  ),
                  const SizedBox(width: 8),
                  ImmichIconButton(
                    icon: Icons.rotate_right,
                    variant: ImmichVariant.ghost,
                    color: ImmichColor.secondary,
                    onPressed: onRotateRight,
                  ),
                ],
              ),
              Row(
                children: [
                  ImmichIconButton(
                    icon: Icons.flip,
                    variant: ImmichVariant.ghost,
                    color: ImmichColor.secondary,
                    onPressed: onFlipHorizontal,
                  ),
                  const SizedBox(width: 8),
                  Transform.rotate(
                    angle: pi / 2,
                    child: ImmichIconButton(
                      icon: Icons.flip,
                      variant: ImmichVariant.ghost,
                      color: ImmichColor.secondary,
                      onPressed: onFlipVertical,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        _AspectRatioSelector(currentAspectRatio: aspectRatio, onAspectRatioSelected: onAspectRatioSelected),
        const SizedBox(height: 32),
      ],
    );
  }
}
