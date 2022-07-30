import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/api.service.dart';

final apiServiceProvider = Provider((ref) => ApiService());
