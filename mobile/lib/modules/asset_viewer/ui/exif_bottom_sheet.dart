import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/immich_asset_with_exif.model.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;

class ExifBottomSheet extends ConsumerWidget {
  final ImmichAssetWithExif assetDetail;

  const ExifBottomSheet({Key? key, required this.assetDetail}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8),
      child: ListView(
        children: [
          assetDetail.exifInfo?.dateTimeOriginal != null
              ? Text(
                  DateFormat('E, LLL d, y • h:mm a').format(
                    DateTime.parse(assetDetail.exifInfo!.dateTimeOriginal!),
                  ),
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                )
              : Container(),
          Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Text(
              "Add Description...",
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 11,
              ),
            ),
          ),

          // Location
          assetDetail.exifInfo?.latitude != null
              ? Padding(
                  padding: const EdgeInsets.only(top: 32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Divider(
                        thickness: 1,
                        color: Colors.grey[600],
                      ),
                      Text(
                        "LOCATION",
                        style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                      ),
                      Text(
                        "${assetDetail.exifInfo!.latitude!.toStringAsFixed(4)}, ${assetDetail.exifInfo!.longitude!.toStringAsFixed(4)}",
                        style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                      )
                    ],
                  ),
                )
              : Container(),
          // Detail
          assetDetail.exifInfo != null
              ? Padding(
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
                          "DETAILS",
                          style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                        ),
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
                        subtitle: Text(
                            "${assetDetail.exifInfo?.exifImageHeight!} x ${assetDetail.exifInfo?.exifImageWidth!}  ${assetDetail.exifInfo?.fileSizeInByte!}B "),
                      ),
                      assetDetail.exifInfo?.make != null
                          ? ListTile(
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
                                  "ƒ/${assetDetail.exifInfo?.fNumber}   1/${(1 / assetDetail.exifInfo!.exposureTime!).toStringAsFixed(0)}   ${assetDetail.exifInfo?.focalLength}mm   ISO${assetDetail.exifInfo?.iso} "),
                            )
                          : Container()
                    ],
                  ),
                )
              : Container()
        ],
      ),
    );
  }
}
