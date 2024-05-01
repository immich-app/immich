import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/services/hash.service.dart';
import 'package:mocktail/mocktail.dart';

class MockHashService extends Mock implements HashService {}

class MockCurrentUserProvider extends StateNotifier<User?>
    with Mock
    implements CurrentUserProvider {
  MockCurrentUserProvider() : super(null);

  @override
  set state(User? user) => super.state = user;
}
