import 'package:flutter/material.dart';
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
  final List<String> assetIds;
  final RemoteAsset? origin;

  EditDateTimeAction._({required this.assetIds, required this.origin, required super.scope, super.isVisible})
    : super(icon: Icons.edit_calendar_outlined, label: scope.context.t.control_bottom_app_bar_edit_time);

  factory EditDateTimeAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final owned = AssetFilter(assets).owned(scope.authUser.id);

    return EditDateTimeAction._(
      assetIds: owned.map((asset) => asset.id).toList(growable: false),
      origin: owned.firstOrNull,
      scope: scope,
      isVisible: owned.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:context, :ref) = scope;

    DateTime? initialDate;
    String? timeZone;
    Duration? offset;

    final seed = origin;
    if (seed != null) {
      final exif = await ref.read(remoteAssetRepositoryProvider).getExif(seed.id);

      // Use EXIF timezone information if available (matching web app and display behavior)
      DateTime dt = seed.createdAt.toLocal();
      offset = dt.timeZoneOffset;
      if (exif?.dateTimeOriginal != null) {
        timeZone = exif!.timeZone;
        (dt, offset) = applyTimezoneOffset(dateTime: exif.dateTimeOriginal!, timeZone: exif.timeZone);
      }
      initialDate = dt;
    }

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

    await save(dateTime);
  }

  @visibleForTesting
  Future<void> save(String dateTime) async {
    final ActionScope(:context, :ref) = scope;

    await ref.read(assetServiceProvider).update(assetIds, dateTime: .some(dateTime));
    ref.invalidate(assetExifProvider);
    ref.read(toastRepositoryProvider).success(context.t.edit_date_and_time_action_prompt(count: assetIds.length));
  }
}
