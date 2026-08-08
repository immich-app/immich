import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/app_metadata.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final appMetadataRepositoryProvider = Provider<AppMetadataRepository>(
  (ref) => AppMetadataRepository(ref.watch(driftProvider)),
);
