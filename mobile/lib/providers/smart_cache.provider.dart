import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/smart_cache.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'smart_cache.provider.g.dart';

@Riverpod(keepAlive: true)
SmartCacheService smartCacheService(Ref _) => SmartCacheService();

@riverpod
Future<SmartCacheStats> smartCacheStats(Ref ref) async {
  return ref.watch(smartCacheServiceProvider).getCacheStats();
}
