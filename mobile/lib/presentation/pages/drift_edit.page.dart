import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/theme/theme_data.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:openapi/api.dart' show CropParameters, RotateParameters, MirrorParameters, MirrorAxis;

@RoutePage()
class DriftEditImagePage extends ConsumerStatefulWidget {
  final Image image;
  final BaseAsset asset;
  final List<AssetEdit> edits;
  final ExifInfo exifInfo;
  final Future<void> Function(List<AssetEdit> edits) applyEdits;

  const DriftEditImagePage({
    super.key,
    required this.image,
    required this.asset,
    required this.edits,
    required this.exifInfo,
    required this.applyEdits,
  });

  @override
  ConsumerState<DriftEditImagePage> createState() => _DriftEditImagePageState();
}

typedef AspectRatio = ({double? ratio, String label});

class _DriftEditImagePageState extends ConsumerState<DriftEditImagePage> with TickerProviderStateMixin {
  late final CropController cropController;

  Duration _rotationAnimationDuration = const Duration(milliseconds: 250);

  int _rotationAngle = 0;
  bool _flipHorizontal = false;
  bool _flipVertical = false;

  double? aspectRatio;

  late final originalWidth = widget.exifInfo.isFlipped ? widget.exifInfo.height : widget.exifInfo.width;
  late final originalHeight = widget.exifInfo.isFlipped ? widget.exifInfo.width : widget.exifInfo.height;

  bool isEditing = false;

  List<AspectRatio> aspectRatios = const [
    (ratio: null, label: 'Free'),
    (ratio: 1.0, label: '1:1'),
    (ratio: 16.0 / 9.0, label: '16:9'),
    (ratio: 3.0 / 2.0, label: '3:2'),
    (ratio: 7.0 / 5.0, label: '7:5'),
    (ratio: 9.0 / 16.0, label: '9:16'),
    (ratio: 2.0 / 3.0, label: '2:3'),
    (ratio: 5.0 / 7.0, label: '5:7'),
  ];

  void initEditor() {
    final existingCrop = widget.edits.firstWhereOrNull((edit) => edit.action == AssetEditAction.crop);

    Rect crop = existingCrop != null && originalWidth != null && originalHeight != null
        ? convertCropParametersToRect(
            CropParameters.fromJson(existingCrop.parameters)!,
            originalWidth!,
            originalHeight!,
          )
        : const Rect.fromLTRB(0, 0, 1, 1);

    cropController = CropController(defaultCrop: crop);

    final transform = normalizeTransformEdits(widget.edits);

    // dont animate to initial rotation
    _rotationAnimationDuration = const Duration(milliseconds: 0);
    _rotationAngle = transform.rotation.toInt();

    _flipHorizontal = transform.mirrorHorizontal;
    _flipVertical = transform.mirrorVertical;
  }

  Future<void> _saveEditedImage() async {
    setState(() {
      isEditing = true;
    });

    final cropParameters = convertRectToCropParameters(cropController.crop, originalWidth ?? 0, originalHeight ?? 0);
    final normalizedRotation = (_rotationAngle % 360 + 360) % 360;
    final edits = <AssetEdit>[];

    if (cropParameters.width != originalWidth || cropParameters.height != originalHeight) {
      edits.add(AssetEdit(action: AssetEditAction.crop, parameters: cropParameters.toJson()));
    }

    if (_flipHorizontal) {
      edits.add(
        AssetEdit(
          action: AssetEditAction.mirror,
          parameters: MirrorParameters(axis: MirrorAxis.horizontal).toJson(),
        ),
      );
    }

    if (_flipVertical) {
      edits.add(
        AssetEdit(
          action: AssetEditAction.mirror,
          parameters: MirrorParameters(axis: MirrorAxis.vertical).toJson(),
        ),
      );
    }

    if (normalizedRotation != 0) {
      edits.add(
        AssetEdit(
          action: AssetEditAction.rotate,
          parameters: RotateParameters(angle: normalizedRotation).toJson(),
        ),
      );
    }

    await widget.applyEdits(edits);

    setState(() {
      isEditing = false;
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
      _rotationAnimationDuration = const Duration(milliseconds: 150);
      _rotationAngle -= 90;
    });
  }

  void _rotateRight() {
    setState(() {
      _rotationAnimationDuration = const Duration(milliseconds: 150);
      _rotationAngle += 90;
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
    });
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: getThemeData(colorScheme: ref.watch(immichThemeProvider).dark, locale: context.locale),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.black,
          title: Text("edit".tr()),
          leading: const ImmichCloseButton(),
          actions: [
            isEditing
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
          child: LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              // Calculate the bounding box size needed for the rotated container
              final baseWidth = constraints.maxWidth * 0.9;
              final baseHeight = constraints.maxHeight * 0.8;

              return Column(
                children: [
                  SizedBox(
                    width: constraints.maxWidth,
                    height: constraints.maxHeight * 0.7,
                    child: Center(
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
                            child: CropImage(controller: cropController, image: widget.image, gridColor: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: context.scaffoldBackgroundColor,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(20),
                          topRight: Radius.circular(20),
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
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
                                        onPressed: _rotateLeft,
                                      ),
                                      const SizedBox(width: 8),
                                      ImmichIconButton(
                                        icon: Icons.rotate_right,
                                        variant: ImmichVariant.ghost,
                                        color: ImmichColor.secondary,
                                        onPressed: _rotateRight,
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      ImmichIconButton(
                                        icon: Icons.flip,
                                        variant: ImmichVariant.ghost,
                                        color: _flipHorizontal ? ImmichColor.primary : ImmichColor.secondary,
                                        onPressed: _flipHorizontally,
                                      ),
                                      const SizedBox(width: 8),
                                      Transform.rotate(
                                        angle: pi / 2,
                                        child: ImmichIconButton(
                                          icon: Icons.flip,
                                          variant: ImmichVariant.ghost,
                                          color: _flipVertical ? ImmichColor.primary : ImmichColor.secondary,
                                          onPressed: _flipVertically,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Row(
                                spacing: 12,
                                children: aspectRatios.map((aspect) {
                                  return _AspectRatioButton(
                                    cropController: cropController,
                                    currentAspectRatio: aspectRatio,
                                    ratio: aspect.ratio,
                                    label: aspect.label,
                                    onPressed: () {
                                      setState(() {
                                        aspectRatio = aspect.ratio;
                                        cropController.aspectRatio = aspect.ratio;
                                      });
                                    },
                                  );
                                }).toList(),
                              ),
                            ),
                            const Spacer(),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _AspectRatioButton extends StatelessWidget {
  final CropController cropController;
  final double? currentAspectRatio;
  final double? ratio;
  final String label;
  final VoidCallback onPressed;

  const _AspectRatioButton({
    required this.cropController,
    required this.currentAspectRatio,
    required this.ratio,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.max,
      children: [
        IconButton(
          iconSize: 36,
          icon: Transform.rotate(
            angle: (ratio ?? 1.0) < 1.0 ? pi / 2 : 0,
            child: Icon(switch (label) {
              'Free' => Icons.crop_free_rounded,
              '1:1' => Icons.crop_square_rounded,
              '16:9' => Icons.crop_16_9_rounded,
              '3:2' => Icons.crop_3_2_rounded,
              '7:5' => Icons.crop_7_5_rounded,
              '9:16' => Icons.crop_16_9_rounded,
              '2:3' => Icons.crop_3_2_rounded,
              '5:7' => Icons.crop_7_5_rounded,
              _ => Icons.crop_free_rounded,
            }, color: currentAspectRatio == ratio ? context.primaryColor : context.themeData.iconTheme.color),
          ),
          onPressed: onPressed,
        ),
        Text(label, style: context.textTheme.displayMedium),
      ],
    );
  }
}
