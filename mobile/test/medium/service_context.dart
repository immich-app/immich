import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';

import '../mockito_targets.handles.dart';
import '../mocks.dart';
import '../utils.dart';
import 'repository_context.dart';

class MediumServiceContext extends MediumRepositoryContext {
  late final UserRepository userRepository = UserRepository(db);
  late final PartnerRepository partnerRepository = PartnerRepository(db);

  final RepositoryMocks mocks = RepositoryMocks();
  PartnerApiRepositoryMock get partnerApi => mocks.partnerApi;

  MediumServiceContext() {
    final id = TestUtils.uuid();
    final partner = UserDto(id: id, email: '$id@example.com', name: 'name $id', profileChangedAt: TestUtils.now());
    partnerApi.create.mockResolvedValue(partner);
    partnerApi.update.mockResolvedValue(partner);
  }
}
