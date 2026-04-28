// photosTimelineQueryProvider — overrides `timelineServiceProvider` inside
// `MainTimelinePage`. Empty filter / pre-login → main library service.
// Non-empty + logged-in → page-1 search-backed service via
// `buildPhotosFilterSearchTimeline`. 500 ms debounce lives in
// `photosTimelineFilterProvider`; consumers watch the result here.

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/photos_filter_search_timeline.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/photos_filter/filter_debounce.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final photosTimelineQueryProvider = Provider<TimelineService>((ref) {
  final filter = ref.watch(photosTimelineFilterProvider);
  final userId = ref.watch(currentUserProvider.select((u) => u?.id));
  final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? const <String>[];
  final factory = ref.watch(timelineFactoryProvider);

  if (userId == null || filter.isEmpty) {
    final svc = factory.main(timelineUsers, userId ?? '');
    ref.onDispose(svc.dispose);
    return svc;
  }

  ref.watch(syncStatusProvider.select((state) => state.remoteContentChangedCount));

  final search = ref.watch(searchServiceProvider);
  final svc = buildPhotosFilterSearchTimeline(factory: factory, search: search, filter: filter);
  ref.onDispose(svc.dispose);
  return svc;
});
