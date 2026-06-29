import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final serverStatsProvider = FutureProvider.autoDispose<ServerStatsResponseDto>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final stats = await apiService.serverInfoApi.getServerStatistics();
  if (stats == null) {
    throw Exception('Failed to load server statistics');
  }
  return stats;
});
