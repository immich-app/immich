import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';

typedef _State = ({List<String> assetIds, RemoteAsset? origin});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final assets = ref.watch(ownedAssetsActionProvider(source));
  if (assets.isEmpty) {
    return null;
  }

  return (assetIds: assets.map((asset) => asset.id).toList(growable: false), origin: assets.singleOrNull);
});

class EditDateTimeAction extends AssetActionBuilder {
  const EditDateTimeAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (!ref.watch(_stateProvider(source).select((state) => state != null))) {
      return null;
    }

    return .new(
      icon: Icons.edit_calendar_outlined,
      label: context.t.control_bottom_app_bar_edit_time,
      onAction: () => _edit(context, ref),
    );
  }

  Future<void> _edit(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final (:assetIds, :origin) = state;
    final remoteAssetRepository = ref.read(remoteAssetRepositoryProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      DateTime? initialDate;
      String? timeZone;
      Duration? offset;

      if (origin != null) {
        final exif = await remoteAssetRepository.getExif(origin.id);

        // Prefer the EXIF timezone, so the picker opens on what the asset actually shows.
        DateTime dateTime = origin.createdAt.toLocal();
        offset = dateTime.timeZoneOffset;
        if (exif?.dateTimeOriginal case final original?) {
          timeZone = exif!.timeZone;
          (dateTime, offset) = applyTimezoneOffset(dateTime: original, timeZone: exif.timeZone);
        }
        initialDate = dateTime;

        if (!context.mounted) {
          return;
        }
      }

      final picked = await showDateTimePicker(
        context: context,
        initialDateTime: initialDate,
        initialTZ: timeZone,
        initialTZOffset: offset,
      );
      if (picked == null || !context.mounted) {
        return;
      }

      await saveDateTime(context, ref, assetIds, picked);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the date and time for assets");
    }
  }
}

@visibleForTesting
Future<void> saveDateTime(BuildContext context, WidgetRef ref, List<String> assetIds, String dateTime) async {
  final message = context.t.edit_date_and_time_action_prompt(count: assetIds.length);
  final toastService = ref.read(toastServiceProvider);

  await ref.read(assetServiceProvider).update(assetIds, dateTime: .some(dateTime));
  ref.invalidate(assetExifProvider);
  toastService.success(message);
}
