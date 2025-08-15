// ignore_for_file: require_trailing_commas

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/hash.dart';

class DriftMemoryBottomInfo extends StatelessWidget {
  final DriftMemory memory;
  final String title;
  final int currentAssetIndex;
  const DriftMemoryBottomInfo({super.key, required this.memory, required this.title, required this.currentAssetIndex});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMMd();
    // When changing the memory page, this method is called before onPageChanged,
    // which might cause currentAssetIndex to go out of the range of memory.assets.length.
    if (currentAssetIndex >= memory.assets.length) {
      return Container();
    }
    final isOwner = fastHash(Store.get(StoreKey.currentUser).id) == fastHash(memory.assets[currentAssetIndex].ownerId);
    final fileCreatedDate = memory.assets.first.createdAt;
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(color: Colors.grey[400], fontSize: 13.0, fontWeight: FontWeight.w500),
              ),
              Text(
                isOwner
                    ? df.format(fileCreatedDate)
                    : "${df.format(fileCreatedDate)}, ${'memory_from_shared_album'.tr()}",
                style: const TextStyle(color: Colors.white, fontSize: 15.0, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          Tooltip(
            message: 'view_in_timeline'.tr(),
            child: isOwner
                ? MaterialButton(
                    minWidth: 0,
                    onPressed: () async {
                      await context.maybePop();
                      await context.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
                      EventStream.shared.emit(ScrollToDateEvent(fileCreatedDate));
                    },
                    shape: const CircleBorder(),
                    color: Colors.white.withValues(alpha: 0.2),
                    elevation: 0,
                    child: const Icon(Icons.open_in_new, color: Colors.white),
                  )
                : Container(),
          ),
        ],
      ),
    );
  }
}
