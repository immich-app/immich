import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'api.provider.g.dart';

// TODO! CONSOLIDATE WITH THE SERVICE FILE

@Riverpod(keepAlive: true)
ApiService apiService(ApiServiceRef ref) => ApiService();
