import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final userMetadataRepository = Provider<DriftUserMetadataRepository>(
  (ref) => DriftUserMetadataRepository(ref.watch(driftProvider)),
);

final userMetadataProvider = FutureProvider<List<UserMetadata>>((ref) async {
  final repository = ref.watch(userMetadataRepository);
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return repository.getUserMetadata(user.id);
});

final userMetadataPreferencesProvider = FutureProvider<Preferences?>((ref) async {
  final metadataList = await ref.watch(userMetadataProvider.future);
  final metadataWithPrefs = metadataList.firstWhere((meta) => meta.preferences != null);
  return metadataWithPrefs.preferences;
});
