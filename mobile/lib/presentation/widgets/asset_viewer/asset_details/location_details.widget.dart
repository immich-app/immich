import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/exif_map.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class LocationDetails extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final ExifInfo? exifInfo;

  const LocationDetails({super.key, required this.asset, this.exifInfo});

  @override
  ConsumerState createState() => _LocationDetailsState();
}

class _LocationDetailsState extends ConsumerState<LocationDetails> {
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

  @override
  void didUpdateWidget(LocationDetails oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.exifInfo != oldWidget.exifInfo) {
      final exif = widget.exifInfo;
      if (exif != null && exif.hasCoordinates) {
        _mapController?.moveCamera(CameraUpdate.newLatLng(LatLng(exif.latitude!, exif.longitude!)));
      }
    }
  }

  void editLocation() async {
    await ref.read(actionProvider.notifier).editLocation(ActionSource.viewer, context);
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final exifInfo = widget.exifInfo;
    final hasCoordinates = exifInfo?.hasCoordinates ?? false;

    // Guard local assets
    if (asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final locationName = _getLocationName(exifInfo);
    final coordinates = "${exifInfo?.latitude?.toStringAsFixed(4)}, ${exifInfo?.longitude?.toStringAsFixed(4)}";

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SheetTile(
            title: 'location'.t(context: context),
            titleStyle: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
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
                    markerId: asset.id,
                    markerAssetThumbhash: asset.thumbHash,
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
                    style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceSecondary),
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
