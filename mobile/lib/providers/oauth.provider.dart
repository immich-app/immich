import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/oauth.service.dart';
import 'package:immich_mobile/providers/api.provider.dart';

final oAuthServiceProvider =
    Provider((ref) => OAuthService(ref.watch(apiServiceProvider)));
