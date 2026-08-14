import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/map.service.dart';

final mapServiceProvider = Provider.autoDispose<MapService>((ref) => MapService(ref.watch(apiServiceProvider)));
