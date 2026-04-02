import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/aspect_ratios.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/pages/edit/editor.provider.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/theme/theme_data.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
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
  Future<void> _saveEditedImage() async {
    ref.read(editorStateProvider.notifier).setIsEditing(true);

    final editorState = ref.read(editorStateProvider);
    final cropParameters = convertRectToCropParameters(
      editorState.crop,
      editorState.originalWidth,
      editorState.originalHeight,
    );
    final edits = <AssetEdit>[];

    if (cropParameters.width != editorState.originalWidth || cropParameters.height != editorState.originalHeight) {
      edits.add(CropEdit(cropParameters));
    }

    if (editorState.flipHorizontal) {
      edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)));
    }

    if (editorState.flipVertical) {
      edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)));
    }

    final normalizedRotation = (editorState.rotationAngle % 360 + 360) % 360;
    if (normalizedRotation != 0) {
      edits.add(RotateEdit(RotateParameters(angle: normalizedRotation)));
    }

    try {
      await widget.applyEdits(edits);
      ImmichToast.show(context: context, msg: 'success'.tr(), toastType: ToastType.success);
      Navigator.of(context).pop();
    } catch (e) {
      ImmichToast.show(context: context, msg: 'error_title'.tr(), toastType: ToastType.error);
    } finally {
      ref.read(editorStateProvider.notifier).setIsEditing(false);
    }
  }

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(editorStateProvider.notifier).init(widget.edits, widget.exifInfo);
    });
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

  @override
  Widget build(BuildContext context) {
    final hasUnsavedEdits = ref.watch(editorStateProvider.select((state) => state.hasUnsavedEdits));

    return PopScope(
      canPop: !hasUnsavedEdits,
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
            leading: ImmichCloseButton(onPressed: () => Navigator.of(context).maybePop()),
            actions: [_SaveEditsButton(onSave: _saveEditedImage)],
          ),
          backgroundColor: Colors.black,
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                Expanded(child: _EditorPreview(image: widget.image)),
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
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _TransformControls(),
                        Padding(
                          padding: EdgeInsets.only(bottom: 36, left: 24, right: 24),
                          child: Row(children: [Spacer(), _ResetEditsButton()]),
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

class _AspectRatioSelector extends ConsumerWidget {
  const _AspectRatioSelector();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editorState = ref.watch(editorStateProvider);
    final editorNotifier = ref.read(editorStateProvider.notifier);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: AspectRatioPreset.values.map((entry) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: _AspectRatioButton(
              ratio: entry,
              isSelected: editorState.aspectRatio == entry.ratio,
              onPressed: () => editorNotifier.setAspectRatio(entry.ratio),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _TransformControls extends ConsumerWidget {
  const _TransformControls();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editorNotifier = ref.read(editorStateProvider.notifier);

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
                    onPressed: editorNotifier.rotateCCW,
                  ),
                  const SizedBox(width: 8),
                  ImmichIconButton(
                    icon: Icons.rotate_right,
                    variant: ImmichVariant.ghost,
                    color: ImmichColor.secondary,
                    onPressed: editorNotifier.rotateCW,
                  ),
                ],
              ),
              Row(
                children: [
                  ImmichIconButton(
                    icon: Icons.flip,
                    variant: ImmichVariant.ghost,
                    color: ImmichColor.secondary,
                    onPressed: editorNotifier.flipHorizontally,
                  ),
                  const SizedBox(width: 8),
                  Transform.rotate(
                    angle: pi / 2,
                    child: ImmichIconButton(
                      icon: Icons.flip,
                      variant: ImmichVariant.ghost,
                      color: ImmichColor.secondary,
                      onPressed: editorNotifier.flipVertically,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const _AspectRatioSelector(),
        const SizedBox(height: 32),
      ],
    );
  }
}

class _SaveEditsButton extends ConsumerWidget {
  final VoidCallback onSave;

  const _SaveEditsButton({required this.onSave});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isApplyingEdits = ref.watch(editorStateProvider.select((state) => state.isApplyingEdits));
    final hasEdits = ref.watch(editorStateProvider.select((state) => state.hasEdits));

    return isApplyingEdits
        ? const Padding(
            padding: EdgeInsets.all(8.0),
            child: SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2.5)),
          )
        : ImmichIconButton(
            icon: Icons.done_rounded,
            color: ImmichColor.primary,
            variant: ImmichVariant.ghost,
            disabled: !hasEdits,
            onPressed: onSave,
          );
  }
}

class _ResetEditsButton extends ConsumerWidget {
  const _ResetEditsButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editorState = ref.watch(editorStateProvider);
    final editorNotifier = ref.read(editorStateProvider.notifier);

    return ImmichTextButton(
      labelText: 'reset'.tr(),
      onPressed: editorNotifier.resetEdits,
      variant: ImmichVariant.ghost,
      expanded: false,
      disabled: !editorState.hasEdits || editorState.isApplyingEdits,
    );
  }
}

class _EditorPreview extends ConsumerStatefulWidget {
  final Image image;

  const _EditorPreview({required this.image});

  @override
  ConsumerState<_EditorPreview> createState() => _EditorPreviewState();
}

class _EditorPreviewState extends ConsumerState<_EditorPreview> with TickerProviderStateMixin {
  late final CropController cropController;

  @override
  void initState() {
    super.initState();

    cropController = CropController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      cropController.crop = ref.read(editorStateProvider.select((state) => state.crop));
    });

    cropController.addListener(onCrop);
  }

  void onCrop() {
    if (!mounted) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (cropController.crop == ref.read(editorStateProvider).crop) {
        return;
      }

      ref.read(editorStateProvider.notifier).setCrop(cropController.crop);
    });
  }

  @override
  void dispose() {
    cropController.removeListener(onCrop);
    cropController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editorState = ref.watch(editorStateProvider);
    final editorNotifier = ref.read(editorStateProvider.notifier);

    ref.listen(editorStateProvider, (_, current) {
      cropController.aspectRatio = current.aspectRatio;

      if (cropController.crop != current.crop) {
        cropController.crop = current.crop;
      }
    });

    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        // Calculate the bounding box size needed for the rotated container
        final baseWidth = constraints.maxWidth * 0.9;
        final baseHeight = constraints.maxHeight * 0.95;

        return Center(
          child: AnimatedRotation(
            turns: editorState.rotationAngle / 360,
            duration: editorState.animationDuration,
            curve: Curves.easeInOut,
            onEnd: editorNotifier.normalizeRotation,
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..scaleByDouble(
                  editorState.flipHorizontal ? -1.0 : 1.0,
                  editorState.flipVertical ? -1.0 : 1.0,
                  1.0,
                  1.0,
                ),
              child: Container(
                padding: const EdgeInsets.all(10),
                width: (editorState.rotationAngle % 180 == 0) ? baseWidth : baseHeight,
                height: (editorState.rotationAngle % 180 == 0) ? baseHeight : baseWidth,
                child: CropImage(controller: cropController, image: widget.image, gridColor: Colors.white),
              ),
            ),
          ),
        );
      },
    );
  }
}
