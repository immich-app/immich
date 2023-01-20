import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/services/oauth.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';

final oAuthServiceProvider =
    Provider((ref) => OAuthService(ref.watch(apiServiceProvider)));
