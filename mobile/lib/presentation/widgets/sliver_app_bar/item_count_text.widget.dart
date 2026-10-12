import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

/// Displays the number of timeline items in this view
///
/// Intended for use in Album style views
class ItemCountText extends ConsumerStatefulWidget {
  final TextStyle style;

  const ItemCountText({super.key, required this.style});

  @override
  ConsumerState<ItemCountText> createState() => _ItemCountTextState();
}

class _ItemCountTextState extends ConsumerState<ItemCountText> {
  StreamSubscription? _reloadSubscription;

  @override
  void initState() {
    super.initState();
    _reloadSubscription = EventStream.shared.listen<TimelineReloadEvent>((_) => setState(() {}));
  }

  @override
  void dispose() {
    unawaited(_reloadSubscription?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assetCount = ref.watch(timelineServiceProvider.select((service) => service.totalAssets));

    return Text(context.t.items_count(count: assetCount), style: context.textTheme.labelLarge?.merge(widget.style));
  }
}
