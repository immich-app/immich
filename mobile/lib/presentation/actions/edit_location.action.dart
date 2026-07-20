import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class EditLocationAction extends BaseAction {
  const EditLocationAction();

  @override
  IconData get icon => Icons.edit_location_alt_outlined;

  @override
  String label(context) => context.t.control_bottom_app_bar_edit_location;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final owned = assetsForAction(ref, assets);
    final ids = owned.map((asset) => asset.id).toList(growable: false);
    if (ids.isEmpty) {
      return;
    }

    final context = ref.context;

    LatLng? initialLatLng;
    final exif = await ref.read(remoteAssetRepositoryProvider).getExif(owned.first.id);
    if (exif?.latitude != null && exif?.longitude != null) {
      initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
    }

    if (!context.mounted) {
      return;
    }

    final location = await showLocationPicker(context: context, initialLatLng: initialLatLng);
    if (location == null) {
      return;
    }

    await save(ref, ids, location);
  }

  @visibleForTesting
  Future<void> save(WidgetRef ref, List<String> ids, LatLng location) async {
    final context = ref.context;
    await ref.read(assetServiceProvider).update(ids, location: .some(location));
    ref.invalidate(assetExifProvider);
    ref.read(toastRepositoryProvider).success(context.t.edit_location_action_prompt(count: ids.length));
  }
}
