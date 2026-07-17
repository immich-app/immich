import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';

class EditDateTimeAction extends BaseAction {
  const EditDateTimeAction();

  @override
  IconData icon(_) => Icons.edit_calendar_outlined;

  @override
  String label(context) => context.t.control_bottom_app_bar_edit_time;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;

    final owned = assetsForAction(ref, assets);
    final ids = owned.map((asset) => asset.id).toList(growable: false);
    if (ids.isEmpty) {
      return;
    }

    DateTime? initialDate;
    String? timeZone;
    Duration? offset;

    final seed = owned.first;
    final exif = await ref.read(remoteAssetRepositoryProvider).getExif(seed.id);

    // Use EXIF timezone information if available (matching web app and display behavior)
    DateTime dt = seed.createdAt.toLocal();
    offset = dt.timeZoneOffset;
    if (exif?.dateTimeOriginal != null) {
      timeZone = exif!.timeZone;
      (dt, offset) = applyTimezoneOffset(dateTime: exif.dateTimeOriginal!, timeZone: exif.timeZone);
    }
    initialDate = dt;

    if (!context.mounted) {
      return;
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

    await save(ref, ids, dateTime);
  }

  @visibleForTesting
  Future<void> save(WidgetRef ref, List<String> ids, String dateTime) async {
    final context = ref.context;
    await ref.read(assetServiceProvider).update(ids, dateTime: .some(dateTime));
    ref.invalidate(assetExifProvider);
    ref.read(toastRepositoryProvider).success(context.t.edit_date_and_time_action_prompt(count: ids.length));
  }
}
