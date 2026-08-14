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
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

typedef _State = ({List<String> assetIds, RemoteAsset? origin});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final assets = ref.watch(ownedAssetsActionProvider(source));
  if (assets.isEmpty) {
    return null;
  }

  return (assetIds: assets.map((asset) => asset.id).toList(growable: false), origin: assets.singleOrNull);
}, dependencies: [ownedAssetsActionProvider]);

class EditLocationAction extends AssetActionBuilder {
  const EditLocationAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (!ref.watch(_stateProvider(source).select((state) => state != null))) {
      return null;
    }

    return .new(
      icon: Icons.edit_location_alt_outlined,
      label: context.t.control_bottom_app_bar_edit_location,
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
      LatLng? initialLatLng;
      if (origin != null) {
        final exif = await remoteAssetRepository.getExif(origin.id);
        if (exif?.latitude != null && exif?.longitude != null) {
          initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
        }
        if (!context.mounted) {
          return;
        }
      }

      final location = await showLocationPicker(context: context, initialLatLng: initialLatLng);
      if (location == null || !context.mounted) {
        return;
      }

      await saveLocation(context, ref, assetIds, location);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the location for assets");
    }
  }
}

@visibleForTesting
Future<void> saveLocation(BuildContext context, WidgetRef ref, List<String> assetIds, LatLng location) async {
  final message = context.t.edit_location_action_prompt(count: assetIds.length);
  final toastService = ref.read(toastServiceProvider);

  await ref.read(assetServiceProvider).update(assetIds, location: .some(location));
  ref.invalidate(assetExifProvider);
  toastService.success(message);
}
