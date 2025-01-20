// ignore_for_file: require_trailing_commas

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_to_date_notifier.provider.dart';
import 'package:immich_mobile/utils/hash.dart';
import '../../entities/store.entity.dart';

class MemoryBottomInfo extends StatelessWidget {
  final Memory memory;
  final int currentAssetIndex;

  const MemoryBottomInfo(
      {super.key, required this.memory, required this.currentAssetIndex});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMMd();
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              memory.title,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 13.0,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              df.format(
                memory.assets[0].fileCreatedAt,
              ),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15.0,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        fastHash(Store.tryGet(StoreKey.currentUser)!.id) ==
                memory.assets[currentAssetIndex].ownerId
            ? MaterialButton(
                minWidth: 0,
                onPressed: () {
                  context.maybePop();
                  scrollToDateNotifierProvider
                      .scrollToDate(memory.assets[0].fileCreatedAt);
                },
                shape: const CircleBorder(),
                color: Colors.white.withOpacity(0.2),
                elevation: 0,
                child: const Icon(
                  Icons.open_in_new,
                  color: Colors.white,
                ),
              )
            : MaterialButton(
                minWidth: 0,
                onPressed: () {},
                color: Colors.white.withOpacity(0),
                elevation: 0,
                child: const Text(
                  "From Shared",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
      ]),
    );
  }
}
