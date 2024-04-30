import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/services/asset.service.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/date_time_picker.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/location_picker.dart';
import 'package:immich_mobile/shared/ui/share_dialog.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

void handleShareAssets(
  WidgetRef ref,
  BuildContext context,
  Iterable<Asset> selection,
) {
  showDialog(
    context: context,
    builder: (BuildContext buildContext) {
      ref.watch(shareServiceProvider).shareAssets(selection.toList()).then(
        (bool status) {
          if (!status) {
            ImmichToast.show(
              context: context,
              msg: 'image_viewer_page_state_provider_share_error'.tr(),
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
          }
          buildContext.pop();
        },
      );
      return const ShareDialog();
    },
    barrierDismissible: false,
  );
}

Future<void> handleArchiveAssets(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection, {
  bool? shouldArchive,
  ToastGravity toastGravity = ToastGravity.BOTTOM,
}) async {
  if (selection.isNotEmpty) {
    shouldArchive ??= !selection.every((a) => a.isArchived);
    await ref
        .read(assetProvider.notifier)
        .toggleArchive(selection, shouldArchive);

    final assetOrAssets = selection.length > 1 ? 'assets' : 'asset';
    final archiveOrLibrary = shouldArchive ? 'archive' : 'library';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: 'Moved ${selection.length} $assetOrAssets to $archiveOrLibrary',
        gravity: toastGravity,
      );
    }
  }
}

Future<void> handleFavoriteAssets(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection, {
  bool? shouldFavorite,
  ToastGravity toastGravity = ToastGravity.BOTTOM,
}) async {
  if (selection.isNotEmpty) {
    shouldFavorite ??= !selection.every((a) => a.isFavorite);
    await ref
        .watch(assetProvider.notifier)
        .toggleFavorite(selection, shouldFavorite);

    final assetOrAssets = selection.length > 1 ? 'assets' : 'asset';
    final toastMessage = shouldFavorite
        ? 'Added ${selection.length} $assetOrAssets to favorites'
        : 'Removed ${selection.length} $assetOrAssets from favorites';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: toastMessage,
        gravity: ToastGravity.BOTTOM,
      );
    }
  }
}

Future<void> handleEditDateTime(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection,
) async {
  DateTime? initialDate;
  String? timeZone;
  Duration? offset;
  if (selection.length == 1) {
    final asset = selection.first;
    final assetWithExif = await ref.watch(assetServiceProvider).loadExif(asset);
    final (dt, oft) = assetWithExif.getTZAdjustedTimeAndOffset();
    initialDate = dt;
    offset = oft;
    timeZone = assetWithExif.exifInfo?.timeZone;
  }
  final dateTime = await showDateTimePicker(
    context: context,
    initialDateTime: initialDate,
    initialTZ: timeZone,
    initialTZOffset: offset,
  );
  if (dateTime == null) {
    return;
  }

  ref.read(assetServiceProvider).changeDateTime(selection.toList(), dateTime);
}

Future<void> handleEditLocation(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection,
) async {
  LatLng? initialLatLng;
  if (selection.length == 1) {
    final asset = selection.first;
    final assetWithExif = await ref.watch(assetServiceProvider).loadExif(asset);
    if (assetWithExif.exifInfo?.latitude != null &&
        assetWithExif.exifInfo?.longitude != null) {
      initialLatLng = LatLng(
        assetWithExif.exifInfo!.latitude!,
        assetWithExif.exifInfo!.longitude!,
      );
    }
  }
  final location = await showLocationPicker(
    context: context,
    initialLatLng: initialLatLng,
  );
  if (location == null) {
    return;
  }

  ref.read(assetServiceProvider).changeLocation(selection.toList(), location);
}
