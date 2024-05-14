import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/error_backup_list.provider.dart';
import 'package:intl/intl.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';

@RoutePage()
class FailedBackupStatusPage extends HookConsumerWidget {
  const FailedBackupStatusPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final errorBackupList = ref.watch(errorBackupListProvider);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          "Failed Backup (${errorBackupList.length})",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          onPressed: () {
            context.maybePop(true);
          },
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
      ),
      body: ListView.builder(
        shrinkWrap: true,
        itemCount: errorBackupList.length,
        itemBuilder: ((context, index) {
          var errorAsset = errorBackupList.elementAt(index);

          return Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 12.0,
              vertical: 4,
            ),
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15), // if you need this
                side: const BorderSide(
                  color: Colors.black12,
                  width: 1,
                ),
              ),
              elevation: 0,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(
                      minWidth: 100,
                      minHeight: 100,
                      maxWidth: 100,
                      maxHeight: 150,
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(15),
                        topLeft: Radius.circular(15),
                      ),
                      clipBehavior: Clip.hardEdge,
                      child: Image(
                        fit: BoxFit.cover,
                        image: AssetEntityImageProvider(
                          errorAsset.asset,
                          isOriginal: false,
                          thumbnailSize: const ThumbnailSize.square(512),
                          thumbnailFormat: ThumbnailFormat.jpeg,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                DateFormat.yMMMMd().format(
                                  DateTime.parse(
                                    errorAsset.fileCreatedAt.toString(),
                                  ).toLocal(),
                                ),
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: context.isDarkTheme
                                      ? Colors.white70
                                      : Colors.grey[800],
                                ),
                              ),
                              Icon(
                                Icons.error,
                                color: Colors.red.withAlpha(200),
                                size: 18,
                              ),
                            ],
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: Text(
                              errorAsset.fileName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: context.primaryColor,
                              ),
                            ),
                          ),
                          Text(
                            errorAsset.errorMessage,
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              color: context.isDarkTheme
                                  ? Colors.white70
                                  : Colors.grey[800],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
