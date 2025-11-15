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
  BaseAsset? asset;
  ExifInfo? exifInfo;
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
    asset = ref.read(currentAssetNotifier);
    setState(() {
      exifInfo = current.valueOrNull;
      final hasCoordinates = exifInfo?.hasCoordinates ?? false;
      if (exifInfo != null && hasCoordinates) {
        _mapController?.moveCamera(CameraUpdate.newLatLng(LatLng(exifInfo!.latitude!, exifInfo!.longitude!)));
      }
    });
  }

  @override
  void initState() {
    super.initState();
    ref.listenManual(currentAssetExifProvider, _onExifChanged, fireImmediately: true);
  }

  @override
  Widget build(BuildContext context) {
    final hasCoordinates = exifInfo?.hasCoordinates ?? false;

    void editLocation() async {
      await ref.read(actionProvider.notifier).editLocation(ActionSource.viewer, context);
    }

    // Guard local assets
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final remoteId = asset is LocalAsset ? (asset as LocalAsset).remoteId : (asset as RemoteAsset).id;
    final locationName = _getLocationName(exifInfo);
    final coordinates = "${exifInfo?.latitude?.toStringAsFixed(4)}, ${exifInfo?.longitude?.toStringAsFixed(4)}";

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: context.isMobile ? 16.0 : 56.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  "exif_bottom_sheet_location".t(context: context),
                  style: context.textTheme.labelMedium?.copyWith(
                    color: context.textTheme.labelMedium?.color?.withAlpha(200),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (hasCoordinates) IconButton(onPressed: editLocation, icon: const Icon(Icons.edit), iconSize: 20),
              ],
            ),
          ),
          if (hasCoordinates)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: context.isMobile ? 16.0 : 56.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ExifMap(exifInfo: exifInfo!, markerId: remoteId, onMapCreated: _onMapCreated),
                  const SizedBox(height: 15),
                  if (locationName != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4.0),
                      child: Text(locationName, style: context.textTheme.labelLarge),
                    ),
                  Text(
                    coordinates,
                    style: context.textTheme.labelMedium?.copyWith(
                      color: context.textTheme.labelMedium?.color?.withAlpha(150),
                    ),
                  ),
                ],
              ),
            ),
          if (!hasCoordinates)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: SheetTile(
                title: "add_a_location".t(context: context),
                titleStyle: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: context.primaryColor,
                ),
                leading: const Icon(Icons.location_off),
                onTap: editLocation,
              ),
            ),
        ],
      ),
    );
  }
}
