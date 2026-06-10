import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/duplicates.repository.dart';
import 'package:openapi/api.dart';
import 'package:immich_mobile/providers/api.provider.dart';

final duplicatesRepositoryProvider = Provider((ref) {
  return DuplicatesApiRepository(
    ref.read(apiServiceProvider).duplicatesApi,
  );
});

final duplicateGroupsProvider = FutureProvider.autoDispose<List<DuplicateResponseDto>>((ref) async {
  final repository = ref.watch(duplicatesRepositoryProvider);
  return repository.getAssetDuplicates();
});
