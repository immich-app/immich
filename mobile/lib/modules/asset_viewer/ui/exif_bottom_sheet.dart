import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:openapi/api.dart';
import 'package:path/path.dart' as p;
import 'package:latlong2/latlong.dart';

class ExifBottomSheet extends ConsumerWidget {
  final AssetResponseDto assetDetail;

  const ExifBottomSheet({Key? key, required this.assetDetail})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    _buildMap() {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: Container(
          height: 150,
          width: MediaQuery.of(context).size.width,
          decoration: const BoxDecoration(
            borderRadius: BorderRadius.all(Radius.circular(15)),
          ),
          child: FlutterMap(
            options: MapOptions(
              center: LatLng(
                assetDetail.exifInfo?.latitude?.toDouble() ?? 0,
                assetDetail.exifInfo?.longitude?.toDouble() ?? 0,
              ),
              zoom: 16.0,
            ),
            layers: [
              TileLayerOptions(
                urlTemplate:
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                subdomains: ['a', 'b', 'c'],
                attributionBuilder: (_) {
                  return const Text(
                    "© OpenStreetMap",
                    style: TextStyle(fontSize: 10),
                  );
                },
              ),
              MarkerLayerOptions(
                markers: [
                  Marker(
                    anchorPos: AnchorPos.align(AnchorAlign.top),
                    point: LatLng(
                      assetDetail.exifInfo?.latitude?.toDouble() ?? 0,
                      assetDetail.exifInfo?.longitude?.toDouble() ?? 0,
                    ),
                    builder: (ctx) => const Image(
                      image: AssetImage('assets/location-pin.png'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    _buildLocationText() {
      return Text(
        "${assetDetail.exifInfo!.city}, ${assetDetail.exifInfo!.state}",
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey[200],
          fontWeight: FontWeight.bold,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8),
      child: ListView(
        children: [
          if (assetDetail.exifInfo?.dateTimeOriginal != null)
            Text(
              DateFormat('date_format'.tr()).format(
                assetDetail.exifInfo!.dateTimeOriginal!.toLocal(),
              ),
              style: TextStyle(
                color: Colors.grey[400],
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Text(
              "exif_bottom_sheet_description",
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 11,
              ),
            ).tr(),
          ),

          // Location
          if (assetDetail.exifInfo?.latitude != null)
            Padding(
              padding: const EdgeInsets.only(top: 32.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Divider(
                    thickness: 1,
                    color: Colors.grey[600],
                  ),
                  Text(
                    "exif_bottom_sheet_location",
                    style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                  ).tr(),
                  if (assetDetail.exifInfo?.latitude != null &&
                      assetDetail.exifInfo?.longitude != null)
                    _buildMap(),
                  if (assetDetail.exifInfo?.city != null &&
                      assetDetail.exifInfo?.state != null)
                    _buildLocationText(),
                  Text(
                    "${assetDetail.exifInfo?.latitude?.toStringAsFixed(4)}, ${assetDetail.exifInfo?.longitude?.toStringAsFixed(4)}",
                    style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                  )
                ],
              ),
            ),
          // Detail
          if (assetDetail.exifInfo != null)
            Padding(
              padding: const EdgeInsets.only(top: 32.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Divider(
                    thickness: 1,
                    color: Colors.grey[600],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Text(
                      "exif_bottom_sheet_details",
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ).tr(),
                  ),
                  ListTile(
                    contentPadding: const EdgeInsets.all(0),
                    dense: true,
                    textColor: Colors.grey[300],
                    iconColor: Colors.grey[300],
                    leading: const Icon(Icons.image),
                    title: Text(
                      "${assetDetail.exifInfo?.imageName!}${p.extension(assetDetail.originalPath)}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: assetDetail.exifInfo?.exifImageHeight != null
                        ? Text(
                            "${assetDetail.exifInfo?.exifImageHeight} x ${assetDetail.exifInfo?.exifImageWidth}  ${assetDetail.exifInfo?.fileSizeInByte!}B ",
                          )
                        : null,
                  ),
                  if (assetDetail.exifInfo?.make != null)
                    ListTile(
                      contentPadding: const EdgeInsets.all(0),
                      dense: true,
                      textColor: Colors.grey[300],
                      iconColor: Colors.grey[300],
                      leading: const Icon(Icons.camera),
                      title: Text(
                        "${assetDetail.exifInfo?.make} ${assetDetail.exifInfo?.model}",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        "ƒ/${assetDetail.exifInfo?.fNumber}   1/${(1 / (assetDetail.exifInfo?.exposureTime ?? 1)).toStringAsFixed(0)}   ${assetDetail.exifInfo?.focalLength}mm   ISO${assetDetail.exifInfo?.iso} ",
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
