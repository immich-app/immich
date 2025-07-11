import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/person.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftPersonProvider = Provider<DriftPersonRepository>(
  (ref) => DriftPersonRepository(ref.watch(driftProvider)),
);
