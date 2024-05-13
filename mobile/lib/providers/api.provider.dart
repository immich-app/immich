import 'package:immich_mobile/services/api.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'api.provider.g.dart';

@Riverpod(keepAlive: true)
ApiService apiService(ApiServiceRef ref) => ApiService();
