import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';

final searchApiRepositoryProvider = Provider(
  (ref) => SearchApiRepository(ref.watch(apiServiceProvider).searchApi),
);

final searchServiceProvider = Provider(
  (ref) => SearchService(ref.watch(searchApiRepositoryProvider)),
);
