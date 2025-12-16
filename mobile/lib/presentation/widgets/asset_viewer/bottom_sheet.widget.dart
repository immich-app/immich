import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/album/album_tile.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/sheet_location_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/sheet_people_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

const _kSeparator = '  •  ';

class AssetDetailBottomSheet extends ConsumerWidget {
  final DraggableScrollableController? controller;
  final double initialChildSize;

  const AssetDetailBottomSheet({this.controller, this.initialChildSize = 0.35, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    return BaseBottomSheet(
      actions: [],
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

  String _getDateTime(BuildContext ctx, BaseAsset asset, ExifInfo? exifInfo) {
    DateTime dateTime = asset.createdAt.toLocal();
    Duration timeZoneOffset = dateTime.timeZoneOffset;

    // Use EXIF timezone information if available (matching web app behavior)
    if (exifInfo?.dateTimeOriginal != null) {
      (dateTime, timeZoneOffset) = applyTimezoneOffset(
        dateTime: exifInfo!.dateTimeOriginal!,
        timeZone: exifInfo.timeZone,
      );
    }

    final date = DateFormat.yMMMEd(ctx.locale.toLanguageTag()).format(dateTime);
    final time = DateFormat.jm(ctx.locale.toLanguageTag()).format(dateTime);
    final timezone = 'GMT${timeZoneOffset.formatAsOffset()}';
    return '$date$_kSeparator$time $timezone';
  }

  String _getFileInfo(BaseAsset asset, ExifInfo? exifInfo) {
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
    final exposureTime = exifInfo.exposureTime.isNotEmpty ? exifInfo.exposureTime : null;
    final iso = exifInfo.iso != null ? 'ISO ${exifInfo.iso}' : null;
    return [exposureTime, iso].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }

  String? _getLensInfoSubtitle(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }
    final fNumber = exifInfo.fNumber.isNotEmpty ? 'ƒ/${exifInfo.fNumber}' : null;
    final focalLength = exifInfo.focalLength.isNotEmpty ? '${exifInfo.focalLength} mm' : null;
    return [fNumber, focalLength].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }

  Future<void> _editDateTime(BuildContext context, WidgetRef ref) async {
    await ref.read(actionProvider.notifier).editDateTime(ActionSource.viewer, context);
  }

  Widget _buildAppearsInList(WidgetRef ref, BuildContext context) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    if (!asset.hasRemote) {
      return const SizedBox.shrink();
    }

    String? remoteAssetId;
    if (asset is RemoteAsset) {
      remoteAssetId = asset.id;
    } else if (asset is LocalAsset) {
      remoteAssetId = asset.remoteAssetId;
    }

    if (remoteAssetId == null) {
      return const SizedBox.shrink();
    }

    final userId = ref.watch(currentUserProvider)?.id;
    final assetAlbums = ref.watch(albumsContainingAssetProvider(remoteAssetId));

    return assetAlbums.when(
      data: (albums) {
        if (albums.isEmpty) {
          return const SizedBox.shrink();
        }

        albums.sortBy((a) => a.name);

        return Column(
          spacing: 12,
          children: [
            if (albums.isNotEmpty)
              SheetTile(
                title: 'appears_in'.t(context: context).toUpperCase(),
                titleStyle: context.textTheme.labelMedium?.copyWith(
                  color: context.textTheme.labelMedium?.color?.withAlpha(200),
                  fontWeight: FontWeight.w600,
                ),
              ),
            Padding(
              padding: const EdgeInsets.only(left: 24),
              child: Column(
                spacing: 12,
                children: albums.map((album) {
                  final isOwner = album.ownerId == userId;
                  return AlbumTile(
                    album: album,
                    isOwner: isOwner,
                    onAlbumSelected: (album) async {
                      ref.invalidate(assetViewerProvider);
                      unawaited(context.router.popAndPush(RemoteAlbumRoute(album: album)));
                    },
                  );
                }).toList(),
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
    final cameraTitle = _getCameraInfoTitle(exifInfo);
    final lensTitle = exifInfo?.lens != null && exifInfo!.lens!.isNotEmpty ? exifInfo.lens : null;
    final isOwner = ref.watch(currentUserProvider)?.id == (asset is RemoteAsset ? asset.ownerId : null);

    // Build file info tile based on asset type
    Widget buildFileInfoTile() {
      if (asset is LocalAsset) {
        final assetMediaRepository = ref.watch(assetMediaRepositoryProvider);
        return FutureBuilder<String?>(
          future: assetMediaRepository.getOriginalFilename(asset.id),
          builder: (context, snapshot) {
            final displayName = snapshot.data ?? asset.name;
            return SheetTile(
              title: displayName,
              titleStyle: context.textTheme.labelLarge,
              leading: Icon(
                asset.isImage ? Icons.image_outlined : Icons.videocam_outlined,
                size: 24,
                color: context.textTheme.labelLarge?.color,
              ),
              subtitle: _getFileInfo(asset, exifInfo),
              subtitleStyle: context.textTheme.labelMedium?.copyWith(
                color: context.textTheme.labelMedium?.color?.withAlpha(200),
              ),
            );
          },
        );
      } else {
        // For remote assets, use the name directly
        return SheetTile(
          title: asset.name,
          titleStyle: context.textTheme.labelLarge,
          leading: Icon(
            asset.isImage ? Icons.image_outlined : Icons.videocam_outlined,
            size: 24,
            color: context.textTheme.labelLarge?.color,
          ),
          subtitle: _getFileInfo(asset, exifInfo),
          subtitleStyle: context.textTheme.labelMedium?.copyWith(
            color: context.textTheme.labelMedium?.color?.withAlpha(200),
          ),
        );
      }
    }

    return SliverList.list(
      children: [
        // Asset Date and Time
        SheetTile(
          title: _getDateTime(context, asset, exifInfo),
          titleStyle: context.textTheme.labelLarge,
          trailing: asset.hasRemote && isOwner ? const Icon(Icons.edit, size: 18) : null,
          onTap: asset.hasRemote && isOwner ? () async => await _editDateTime(context, ref) : null,
        ),
        if (exifInfo != null) _SheetAssetDescription(exif: exifInfo, isEditable: isOwner),
        const SheetPeopleDetails(),
        const SheetLocationDetails(),
        // Details header
        SheetTile(
          title: 'details'.t(context: context).toUpperCase(),
          titleStyle: context.textTheme.labelMedium?.copyWith(
            color: context.textTheme.labelMedium?.color?.withAlpha(200),
            fontWeight: FontWeight.w600,
          ),
        ),
        // File info
        buildFileInfoTile(),
        // Camera info
        if (cameraTitle != null) ...[
          const SizedBox(height: 16),
          SheetTile(
            title: cameraTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(Icons.camera_alt_outlined, size: 24, color: context.textTheme.labelLarge?.color),
            subtitle: _getCameraInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(200),
            ),
          ),
        ],
        // Lens info
        if (lensTitle != null) ...[
          const SizedBox(height: 16),
          SheetTile(
            title: lensTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(Icons.camera_outlined, size: 24, color: context.textTheme.labelLarge?.color),
            subtitle: _getLensInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(200),
            ),
          ),
        ],
        // Appears in (Albums)
        Padding(padding: const EdgeInsets.only(top: 16.0), child: _buildAppearsInList(ref, context)),
        // padding at the bottom to avoid cut-off
        const SizedBox(height: 100),
      ],
    );
  }
}

class _SheetAssetDescription extends ConsumerStatefulWidget {
  final ExifInfo exif;
  final bool isEditable;

  const _SheetAssetDescription({required this.exif, this.isEditable = true});

  @override
  ConsumerState<_SheetAssetDescription> createState() => _SheetAssetDescriptionState();
}

class _SheetAssetDescriptionState extends ConsumerState<_SheetAssetDescription> {
  late TextEditingController _controller;
  final _descriptionFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.exif.description ?? '');
  }

  Future<void> saveDescription(String? previousDescription) async {
    final newDescription = _controller.text.trim();

    if (newDescription == previousDescription) {
      _descriptionFocus.unfocus();
      return;
    }

    final editAction = await ref.read(actionProvider.notifier).updateDescription(ActionSource.viewer, newDescription);

    if (!editAction.success) {
      _controller.text = previousDescription ?? '';

      ImmichToast.show(
        context: context,
        msg: 'exif_bottom_sheet_description_error'.t(context: context),
        toastType: ToastType.error,
      );
    }

    _descriptionFocus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    // Watch the current asset EXIF provider to get updates
    final currentExifInfo = ref.watch(currentAssetExifProvider).valueOrNull;

    // Update controller text when EXIF data changes
    final currentDescription = currentExifInfo?.description ?? '';
    final hintText = (widget.isEditable ? 'exif_bottom_sheet_description' : 'exif_bottom_sheet_no_description').t(
      context: context,
    );
    if (_controller.text != currentDescription && !_descriptionFocus.hasFocus) {
      _controller.text = currentDescription;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
      child: IgnorePointer(
        ignoring: !widget.isEditable,
        child: TextField(
          controller: _controller,
          keyboardType: TextInputType.multiline,
          focusNode: _descriptionFocus,
          maxLines: null, // makes it grow as text is added
          decoration: InputDecoration(
            hintText: hintText,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            disabledBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            focusedErrorBorder: InputBorder.none,
          ),
          onTapOutside: (_) => saveDescription(currentExifInfo?.description),
        ),
      ),
    );
  }
}
