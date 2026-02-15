import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

const _kSeparator = '  •  ';

class TechnicalDetails extends ConsumerWidget {
  const TechnicalDetails({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) return const SizedBox.shrink();

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
    final cameraTitle = _getCameraInfoTitle(exifInfo);
    final lensTitle = exifInfo?.lens != null && exifInfo!.lens!.isNotEmpty ? exifInfo.lens : null;

    return Column(
      children: [
        SheetTile(
          title: 'details'.t(context: context),
          titleStyle: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
        ),
        _buildFileInfoTile(context, ref, asset, exifInfo),
        if (cameraTitle != null) ...[
          const SizedBox(height: 16),
          SheetTile(
            title: cameraTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(Icons.camera_alt_outlined, size: 24, color: context.textTheme.labelLarge?.color),
            subtitle: _getCameraInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
        ],
        if (lensTitle != null) ...[
          const SizedBox(height: 16),
          SheetTile(
            title: lensTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(Icons.camera_outlined, size: 24, color: context.textTheme.labelLarge?.color),
            subtitle: _getLensInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
        ],
      ],
    );
  }

  Widget _buildFileInfoTile(BuildContext context, WidgetRef ref, BaseAsset asset, ExifInfo? exifInfo) {
    final icon = Icon(
      asset.isImage ? Icons.image_outlined : Icons.videocam_outlined,
      size: 24,
      color: context.textTheme.labelLarge?.color,
    );
    final subtitle = _getFileInfo(asset, exifInfo);
    final subtitleStyle = context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary);

    if (asset is LocalAsset) {
      final assetMediaRepository = ref.watch(assetMediaRepositoryProvider);
      return FutureBuilder<String?>(
        future: assetMediaRepository.getOriginalFilename(asset.id),
        builder: (context, snapshot) {
          return SheetTile(
            title: snapshot.data ?? asset.name,
            titleStyle: context.textTheme.labelLarge,
            leading: icon,
            subtitle: subtitle,
            subtitleStyle: subtitleStyle,
          );
        },
      );
    }

    return SheetTile(
      title: asset.name,
      titleStyle: context.textTheme.labelLarge,
      leading: icon,
      subtitle: subtitle,
      subtitleStyle: subtitleStyle,
    );
  }

  static String _getFileInfo(BaseAsset asset, ExifInfo? exifInfo) {
    final height = asset.height;
    final width = asset.width;
    final resolution = (width != null && height != null) ? "${width.toInt()} x ${height.toInt()}" : null;
    final fileSize = exifInfo?.fileSize != null ? formatBytes(exifInfo!.fileSize!) : null;

    return switch ((fileSize, resolution)) {
      (null, null) => '',
      (String fileSize, null) => fileSize,
      (null, String resolution) => resolution,
      (String fileSize, String resolution) => '$fileSize$_kSeparator$resolution',
    };
  }

  static String? _getCameraInfoTitle(ExifInfo? exifInfo) {
    if (exifInfo == null) return null;
    return switch ((exifInfo.make, exifInfo.model)) {
      (null, null) => null,
      (String make, null) => make,
      (null, String model) => model,
      (String make, String model) => '$make $model',
    };
  }

  static String? _getCameraInfoSubtitle(ExifInfo? exifInfo) {
    if (exifInfo == null) return null;
    final exposureTime = exifInfo.exposureTime.isNotEmpty ? exifInfo.exposureTime : null;
    final iso = exifInfo.iso != null ? 'ISO ${exifInfo.iso}' : null;
    return [exposureTime, iso].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }

  static String? _getLensInfoSubtitle(ExifInfo? exifInfo) {
    if (exifInfo == null) return null;
    final fNumber = exifInfo.fNumber.isNotEmpty ? 'ƒ/${exifInfo.fNumber}' : null;
    final focalLength = exifInfo.focalLength.isNotEmpty ? '${exifInfo.focalLength} mm' : null;
    return [fNumber, focalLength].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }
}
