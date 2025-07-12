import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final userMetadataRepository = Provider<DriftUserMetadataRepository>(
  (ref) => DriftUserMetadataRepository(ref.watch(driftProvider)),
);
