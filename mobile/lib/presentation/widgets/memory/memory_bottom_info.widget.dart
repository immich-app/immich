import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_title.widget.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:intl/intl.dart';

class MemoryBottomInfo extends StatelessWidget {
  final Memory memory;
  final RemoteAsset asset;
  const MemoryBottomInfo({super.key, required this.memory, required this.asset});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMMd(resolvedDateTimeLocale());
    final fileCreatedDate = asset.createdAt;
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        spacing: 16.0,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  getMemoryTitle(context.t, memory, asset: asset),
                  style: TextStyle(color: Colors.grey[400], fontSize: 13.0, fontWeight: FontWeight.w500),
                ),
                Text(
                  df.format(fileCreatedDate.toLocal()),
                  style: const TextStyle(color: Colors.white, fontSize: 15.0, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          Tooltip(
            message: context.t.view_in_timeline,
            child: MaterialButton(
              minWidth: 0,
              onPressed: () async {
                await context.router.navigate(const TabShellRoute(children: [MainTimelineRoute()]));
                EventStream.shared.emit(ScrollToDateEvent(fileCreatedDate.toLocal()));
              },
              shape: const CircleBorder(),
              color: Colors.white.withValues(alpha: 0.2),
              elevation: 0,
              child: const Icon(Icons.open_in_new, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
