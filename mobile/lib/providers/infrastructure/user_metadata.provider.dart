import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final userMetadataRepository = Provider<DriftUserMetadataRepository>(
  (ref) => DriftUserMetadataRepository(ref.watch(driftProvider)),
);

final userMetadataProvider = FutureProvider.family<List<UserMetadata>, String>((ref, String userId) async {
  final repository = ref.watch(userMetadataRepository);
  return repository.getUserMetadata(userId);
});
