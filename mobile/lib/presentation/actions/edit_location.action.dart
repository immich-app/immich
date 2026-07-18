import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class EditLocationAction extends BaseAction {
  final List<String> assetIds;
  final RemoteAsset? origin;

  const EditLocationAction._({
    required this.assetIds,
    required this.origin,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory EditLocationAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final owned = assets
        .whereType<RemoteAsset>()
        .where((asset) => asset.ownerId == scope.authUser.id)
        .toList(growable: false);

    return EditLocationAction._(
      assetIds: owned.map((asset) => asset.id).toList(growable: false),
      origin: owned.length == 1 ? owned.first : null,
      scope: scope,
      icon: Icons.edit_location_alt_outlined,
      label: scope.context.t.control_bottom_app_bar_edit_location,
      isVisible: owned.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:context, :ref) = scope;

    LatLng? initialLatLng;
    final seed = origin;
    if (seed != null) {
      final exif = await ref.read(remoteAssetRepositoryProvider).getExif(seed.id);
      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    if (!context.mounted) {
      return;
    }

    final location = await showLocationPicker(context: context, initialLatLng: initialLatLng);
    if (location == null) {
      return;
    }

    await save(location);
  }

  @visibleForTesting
  Future<void> save(LatLng location) async {
    final ActionScope(:context, :ref) = scope;

    await ref.read(assetServiceProvider).update(assetIds, location: .some(location));
    ref.invalidate(assetExifProvider);
    ref.read(toastRepositoryProvider).success(context.t.edit_location_action_prompt(count: assetIds.length));
  }
}
