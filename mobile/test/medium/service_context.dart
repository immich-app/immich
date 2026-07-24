import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../api.mocks.dart';
import '../domain/service.mock.dart';
import '../repository.mocks.dart';
import '../utils.dart';
import 'repository_context.dart';

class MediumServiceContext extends MediumRepositoryContext {
  late final UserRepository userRepository = UserRepository(db);
  late final PartnerRepository partnerRepository = PartnerRepository(db);
  late final DriftTrashSyncRepository trashSyncRepository = DriftTrashSyncRepository(db);
  late final SettingsRepository settings;

  final partnerApi = MockPartnerApiRepository();
  final assetMediaApi = MockAssetMediaApi();
  final permissionRepository = MockPermissionRepository();

  MediumServiceContext._() {
    _stubPartnerApi(partnerApi);
    _stubPermissionRepository(permissionRepository);
    _stubAssetMediaApi(assetMediaApi);
  }

  static Future<MediumServiceContext> init() async {
    final context = MediumServiceContext._();
    context.settings = await SettingsRepository.ensureInitialized(context.db);
    return context;
  }

  @override
  Future<void> dispose() async {
    await SettingsRepository.reset();
    await super.dispose();
  }
}

void _stubPartnerApi(MockPartnerApiRepository api) {
  final id = TestUtils.uuid();
  final partner = UserDto(id: id, email: '$id@example.com', name: 'name $id', profileChangedAt: TestUtils.now());

  registerFallbackValue(Direction.sharedByMe);
  when(() => api.getAll(any())).thenAnswer((_) async => const <UserDto>[]);
  when(() => api.create(any())).thenAnswer((_) async => partner);
  when(() => api.update(any(), inTimeline: any(named: 'inTimeline'))).thenAnswer((_) async => partner);
  when(() => api.delete(any())).thenAnswer((_) async {});
}

void _stubPermissionRepository(MockPermissionRepository permission) {
  when(() => permission.hasManageMediaPermission()).thenAnswer((_) async => true);
}

void _stubAssetMediaApi(MockAssetMediaApi assetMediaApi) {
  registerFallbackValue(const <String>[]);
  when(() => assetMediaApi.trash(any())).thenAnswer((_) async => []);
  when(() => assetMediaApi.restore(any())).thenAnswer((_) async => []);
  when(() => assetMediaApi.trashedAmong(any())).thenAnswer((_) async => []);
}
