import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../api.mocks.dart';
import '../infrastructure/repository.mock.dart';
import '../service.mocks.dart';

void main() {
  late ServerInfoService sut;
  late MockServerApi mockServerApi;
  late MockBackupRepository mockBackupRepository;

  setUpAll(() async {
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db));
  });

  setUp(() {
    final mockApiService = MockApiService();
    mockServerApi = MockServerApi();
    mockBackupRepository = MockBackupRepository();
    when(() => mockApiService.serverInfoApi).thenReturn(mockServerApi);
    when(() => mockBackupRepository.clearUnsupported()).thenAnswer((_) async {});

    sut = ServerInfoService(mockApiService, mockBackupRepository);
  });

  group('refreshSupportedFileExtensions', () {
    test('saves the server list and clears the unsupported marks only when the list changes', () async {
      when(
        () => mockServerApi.getSupportedMediaTypes(),
      ).thenAnswer((_) async => ServerMediaTypesResponseDto(image: ['.jpg'], video: ['.mp4']));

      await sut.refreshSupportedFileExtensions();
      await sut.refreshSupportedFileExtensions();

      expect(Store.tryGet(StoreKey.supportedFileExtensions), {'.jpg', '.mp4'});
      verify(() => mockBackupRepository.clearUnsupported()).called(1);

      when(
        () => mockServerApi.getSupportedMediaTypes(),
      ).thenAnswer((_) async => ServerMediaTypesResponseDto(image: ['.jpg', '.djvu'], video: ['.mp4']));

      await sut.refreshSupportedFileExtensions();

      expect(Store.tryGet(StoreKey.supportedFileExtensions), {'.jpg', '.djvu', '.mp4'});
      verify(() => mockBackupRepository.clearUnsupported()).called(1);
    });
  });
}
