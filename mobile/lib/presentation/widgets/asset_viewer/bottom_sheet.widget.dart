import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/location_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

const _kSeparator = '  •  ';

class AssetDetailBottomSheet extends ConsumerWidget {
  final DraggableScrollableController? controller;
  final double initialChildSize;

  const AssetDetailBottomSheet({
    this.controller,
    this.initialChildSize = 0.35,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final isTrashEnable = ref.watch(
      serverInfoProvider.select((state) => state.serverFeatures.trash),
    );

    final isInLockedView = ref.watch(inLockedViewProvider);

    final actions = <Widget>[
      const ShareActionButton(source: ActionSource.viewer),
      if (asset.hasRemote) ...[
        const ShareLinkActionButton(source: ActionSource.viewer),
        const ArchiveActionButton(source: ActionSource.viewer),
        if (!asset.hasLocal) const DownloadActionButton(source: ActionSource.viewer),
        isTrashEnable
            ? const TrashActionButton(source: ActionSource.viewer)
            : const DeletePermanentActionButton(source: ActionSource.viewer),
        const DeleteActionButton(source: ActionSource.viewer),
        const MoveToLockFolderActionButton(
          source: ActionSource.viewer,
        ),
      ],
      if (asset.storage == AssetState.local) ...[
        const DeleteLocalActionButton(source: ActionSource.viewer),
        const UploadActionButton(source: ActionSource.timeline),
      ],
    ];

    final lockedViewActions = <Widget>[];

    return BaseBottomSheet(
      actions: isInLockedView ? lockedViewActions : actions,
      slivers: const [_AssetDetailBottomSheet()],
      controller: controller,
      initialChildSize: initialChildSize,
      minChildSize: 0.1,
      maxChildSize: 0.88,
      expand: false,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
    );
  }
}

class _AssetDetailBottomSheet extends ConsumerWidget {
  const _AssetDetailBottomSheet();

  String _getDateTime(BuildContext ctx, BaseAsset asset) {
    final dateTime = asset.createdAt.toLocal();
    final date = DateFormat.yMMMEd(ctx.locale.toLanguageTag()).format(dateTime);
    final time = DateFormat.jm(ctx.locale.toLanguageTag()).format(dateTime);
    final timezone = dateTime.timeZoneOffset.isNegative
        ? 'UTC-${dateTime.timeZoneOffset.inHours.abs().toString().padLeft(2, '0')}:${(dateTime.timeZoneOffset.inMinutes.abs() % 60).toString().padLeft(2, '0')}'
        : 'UTC+${dateTime.timeZoneOffset.inHours.toString().padLeft(2, '0')}:${(dateTime.timeZoneOffset.inMinutes.abs() % 60).toString().padLeft(2, '0')}';
    return '$date$_kSeparator$time $timezone';
  }

  String _getFileInfo(BaseAsset asset, ExifInfo? exifInfo) {
    final height = asset.height ?? exifInfo?.height;
    final width = asset.width ?? exifInfo?.width;
    final resolution = (width != null && height != null) ? "${width.toInt()} x ${height.toInt()}" : null;
    final fileSize = exifInfo?.fileSize != null ? formatBytes(exifInfo!.fileSize!) : null;

    return switch ((fileSize, resolution)) {
      (null, null) => '',
      (String fileSize, null) => fileSize,
      (null, String resolution) => resolution,
      (String fileSize, String resolution) => '$fileSize$_kSeparator$resolution',
    };
  }

  String? _getCameraInfoTitle(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }

    return switch ((exifInfo.make, exifInfo.model)) {
      (null, null) => null,
      (String make, null) => make,
      (null, String model) => model,
      (String make, String model) => '$make $model',
    };
  }

  String? _getCameraInfoSubtitle(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }

    final fNumber = exifInfo.fNumber.isNotEmpty ? 'ƒ/${exifInfo.fNumber}' : null;
    final exposureTime = exifInfo.exposureTime.isNotEmpty ? exifInfo.exposureTime : null;
    final focalLength = exifInfo.focalLength.isNotEmpty ? '${exifInfo.focalLength} mm' : null;
    final iso = exifInfo.iso != null ? 'ISO ${exifInfo.iso}' : null;

    return [fNumber, exposureTime, focalLength, iso].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
    final cameraTitle = _getCameraInfoTitle(exifInfo);

    return SliverList.list(
      children: [
        // Asset Date and Time
        _SheetTile(
          title: _getDateTime(context, asset),
          titleStyle: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SheetLocationDetails(),
        // Details header
        _SheetTile(
          title: 'exif_bottom_sheet_details'.t(context: context),
          titleStyle: context.textTheme.labelMedium?.copyWith(
            color: context.textTheme.labelMedium?.color?.withAlpha(200),
            fontWeight: FontWeight.w600,
          ),
        ),
        // File info
        _SheetTile(
          title: asset.name,
          titleStyle: context.textTheme.labelLarge,
          leading: Icon(
            asset.isImage ? Icons.image_outlined : Icons.videocam_outlined,
            size: 24,
            color: context.textTheme.labelLarge?.color,
          ),
          subtitle: _getFileInfo(asset, exifInfo),
          subtitleStyle: context.textTheme.bodyMedium?.copyWith(
            color: context.textTheme.bodyMedium?.color?.withAlpha(155),
          ),
        ),
        // Camera info
        if (cameraTitle != null)
          _SheetTile(
            title: cameraTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(
              Icons.camera_outlined,
              size: 24,
              color: context.textTheme.labelLarge?.color,
            ),
            subtitle: _getCameraInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.bodyMedium?.copyWith(
              color: context.textTheme.bodyMedium?.color?.withAlpha(155),
            ),
          ),
      ],
    );
  }
}

class _SheetTile extends StatelessWidget {
  final String title;
  final Widget? leading;
  final String? subtitle;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;

  const _SheetTile({
    required this.title,
    this.titleStyle,
    this.leading,
    this.subtitle,
    this.subtitleStyle,
  });

  @override
  Widget build(BuildContext context) {
    final Widget titleWidget;
    if (leading == null) {
      titleWidget = LimitedBox(
        maxWidth: double.infinity,
        child: Text(title, style: titleStyle),
      );
    } else {
      titleWidget = Container(
        width: double.infinity,
        padding: const EdgeInsets.only(left: 15),
        child: Text(title, style: titleStyle),
      );
    }

    final Widget? subtitleWidget;
    if (leading == null && subtitle != null) {
      subtitleWidget = Text(subtitle!, style: subtitleStyle);
    } else if (leading != null && subtitle != null) {
      subtitleWidget = Padding(
        padding: const EdgeInsets.only(left: 15),
        child: Text(subtitle!, style: subtitleStyle),
      );
    } else {
      subtitleWidget = null;
    }

    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      title: titleWidget,
      titleAlignment: ListTileTitleAlignment.center,
      leading: leading,
      contentPadding: leading == null ? null : const EdgeInsets.only(left: 25),
      subtitle: subtitleWidget,
    );
  }
}
