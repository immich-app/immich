import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../api.mocks.dart';
import '../utils.dart';
import 'repository_context.dart';

void _stubPartnerApi(MockPartnerApiRepository api) {
  final id = TestUtils.uuid();
  final partner = UserDto(id: id, email: '$id@example.com', name: 'name $id', profileChangedAt: TestUtils.now());

  registerFallbackValue(Direction.sharedByMe);
  when(() => api.getAll(any())).thenAnswer((_) async => const <UserDto>[]);
  when(() => api.create(any())).thenAnswer((_) async => partner);
  when(() => api.update(any(), inTimeline: any(named: 'inTimeline'))).thenAnswer((_) async => partner);
  when(() => api.delete(any())).thenAnswer((_) async {});
}

class MediumServiceContext extends MediumRepositoryContext {
  late final UserRepository userRepository = UserRepository(db);
  late final PartnerRepository partnerRepository = PartnerRepository(db);

  final partnerApi = MockPartnerApiRepository();

  MediumServiceContext() {
    _stubPartnerApi(partnerApi);
  }
}
