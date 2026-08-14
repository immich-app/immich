import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

final storeServiceProvider = Provider((_) => StoreService.I);
