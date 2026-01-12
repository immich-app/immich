import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/exif_map.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class SheetLocationDetails extends ConsumerStatefulWidget {
  const SheetLocationDetails({super.key});

  @override
  ConsumerState createState() => _SheetLocationDetailsState();
}

class _SheetLocationDetailsState extends ConsumerState<SheetLocationDetails> {
  MapLibreMapController? _mapController;

  String? _getLocationName(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }

    final cityName = exifInfo.city;
    final stateName = exifInfo.state;

    if (cityName != null && stateName != null) {
      return "$cityName, $stateName";
    }
    return null;
  }

  void _onMapCreated(MapLibreMapController controller) {
    _mapController = controller;
  }

  void _onExifChanged(AsyncValue<ExifInfo?>? previous, AsyncValue<ExifInfo?> current) {
    final currentExif = current.valueOrNull;

    if (currentExif != null && currentExif.hasCoordinates) {
      _mapController?.moveCamera(CameraUpdate.newLatLng(LatLng(currentExif.latitude!, currentExif.longitude!)));
    }
  }

  @override
  void initState() {
    super.initState();
    ref.listenManual(currentAssetExifProvider, _onExifChanged, fireImmediately: true);
  }

  void editLocation() async {
    await ref.read(actionProvider.notifier).editLocation(ActionSource.viewer, context);
  }

  @override
  Widget build(BuildContext context) {
    final asset = ref.watch(currentAssetNotifier);
    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
    final hasCoordinates = exifInfo?.hasCoordinates ?? false;

    // Guard local assets
    if (asset != null && asset is LocalAsset && asset.hasRemote) {
      return const SizedBox.shrink();
    }

    final remoteAsset = asset as RemoteAsset;
    final locationName = _getLocationName(exifInfo);
    final coordinates = "${exifInfo?.latitude?.toStringAsFixed(4)}, ${exifInfo?.longitude?.toStringAsFixed(4)}";

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SheetTile(
            title: 'location'.t(context: context).toUpperCase(),
            titleStyle: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(200),
              fontWeight: FontWeight.w600,
            ),
            trailing: hasCoordinates ? const Icon(Icons.edit_location_alt, size: 20) : null,
            onTap: editLocation,
          ),
          if (hasCoordinates)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: context.isMobile ? 16.0 : 56.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ExifMap(
                    exifInfo: exifInfo!,
                    markerId: remoteAsset.id,
                    markerAssetThumbhash: remoteAsset.thumbHash,
                    onMapCreated: _onMapCreated,
                  ),
                  const SizedBox(height: 16),
                  if (locationName != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4.0),
                      child: Text(locationName, style: context.textTheme.labelLarge),
                    ),
                  Text(
                    coordinates,
                    style: context.textTheme.labelMedium?.copyWith(
                      color: context.textTheme.labelMedium?.color?.withAlpha(200),
                    ),
                  ),
                ],
              ),
            ),
          if (!hasCoordinates)
            SheetTile(
              title: "add_a_location".t(context: context),
              titleStyle: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: context.primaryColor,
              ),
              leading: const Icon(Icons.location_off),
              onTap: editLocation,
            ),
        ],
      ),
    );
  }
}
