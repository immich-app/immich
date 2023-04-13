import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/description_input.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';
import 'package:latlong2/latlong.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

class ExifBottomSheet extends HookConsumerWidget {
  final Asset asset;

  const ExifBottomSheet({Key? key, required this.asset}) : super(key: key);

  bool get showMap =>
      asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exifInfo = asset.exifInfo;
    var isDarkTheme = Theme.of(context).brightness == Brightness.dark;
    var textColor = isDarkTheme ? Colors.white : Colors.black;

    buildMap() {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Container(
              height: 150,
              width: constraints.maxWidth,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.all(Radius.circular(15)),
              ),
              child: FlutterMap(
                options: MapOptions(
                  interactiveFlags: InteractiveFlag.none,
                  center: LatLng(
                    exifInfo?.latitude ?? 0,
                    exifInfo?.longitude ?? 0,
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
                          exifInfo?.latitude ?? 0,
                          exifInfo?.longitude ?? 0,
                        ),
                        builder: (ctx) => const Image(
                          image: AssetImage('assets/location-pin.png'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      );
    }

    buildSizeText(Asset a) {
      String resolution = a.width != null && a.height != null
          ? "${a.height} x ${a.width}  "
          : "";
      String fileSize = a.exifInfo?.fileSize != null
          ? formatBytes(a.exifInfo!.fileSize!)
          : "";
      String text = resolution + fileSize;
      return text.isEmpty ? null : Text(text);
    }

    buildDragHeader() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          SizedBox(height: 12),
          Align(
            alignment: Alignment.center,
            child: CustomDraggingHandle(),
          ),
          SizedBox(height: 12),
        ],
      );
    }

    buildLocation() {
      // Guard no lat/lng
      if (!showMap) {
        return Container();
      }

      return Column(
        children: [
          // Location
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "exif_bottom_sheet_location",
                style: TextStyle(
                  fontSize: 11,
                  color: textColor,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
              buildMap(),
              RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                    fontFamily: 'WorkSans',
                  ),
                  children: [
                    if (exifInfo != null && exifInfo.city != null)
                      TextSpan(
                        text: exifInfo.city,
                      ),
                    if (exifInfo != null &&
                        exifInfo.city != null &&
                        exifInfo.state != null)
                      const TextSpan(
                        text: ", ",
                      ),
                    if (exifInfo != null && exifInfo.state != null)
                      TextSpan(
                        text: "${exifInfo.state}",
                      ),
                  ],
                ),
              ),
              Text(
                "${exifInfo!.latitude!.toStringAsFixed(4)}, ${exifInfo.longitude!.toStringAsFixed(4)}",
                style: const TextStyle(fontSize: 12),
              )
            ],
          ),
        ],
      );
    }

    buildDate() {
      final fileCreatedAt = asset.fileCreatedAt.toLocal();
      final date = DateFormat.yMMMEd().format(fileCreatedAt);
      final time = DateFormat.jm().format(fileCreatedAt);

      return Text(
        '$date • $time',
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      );
    }

    buildDetail() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              "exif_bottom_sheet_details",
              style: TextStyle(
                fontSize: 11,
                color: textColor,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
          ListTile(
            contentPadding: const EdgeInsets.all(0),
            dense: true,
            leading: Icon(
              Icons.image,
              color: textColor.withAlpha(200),
            ),
            title: Text(
              asset.fileName,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            subtitle: buildSizeText(asset),
          ),
          if (exifInfo?.make != null)
            ListTile(
              contentPadding: const EdgeInsets.all(0),
              dense: true,
              leading: Icon(
                Icons.camera,
                color: textColor.withAlpha(200),
              ),
              title: Text(
                "${exifInfo!.make} ${exifInfo.model}",
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              subtitle: Text(
                "ƒ/${exifInfo.fNumber}   ${exifInfo.exposureTime}   ${exifInfo.focalLength} mm   ISO${exifInfo.iso} ",
              ),
            ),
        ],
      );
    }

    return GestureDetector(
      onTap: () {
        // FocusScope.of(context).unfocus();
      },
      child: SingleChildScrollView(
        child: Card(
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(15),
              topRight: Radius.circular(15),
            ),
          ),
          margin: const EdgeInsets.all(0),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16.0),
            child: LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 600) {
                  // Two column
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        buildDragHeader(),
                        buildDate(),
                        if (asset.isRemote) DescriptionInput(asset: asset),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Flexible(
                              flex: showMap ? 5 : 0,
                              child: Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: buildLocation(),
                              ),
                            ),
                            Flexible(
                              flex: 5,
                              child: Padding(
                                padding: const EdgeInsets.only(left: 8.0),
                                child: buildDetail(),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 50),
                      ],
                    ),
                  );
                }

                // One column
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    buildDragHeader(),
                    buildDate(),
                    if (asset.isRemote) DescriptionInput(asset: asset),
                    const SizedBox(height: 8.0),
                    buildLocation(),
                    SizedBox(height: showMap ? 16.0 : 0.0),
                    buildDetail(),
                    const SizedBox(height: 50),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
