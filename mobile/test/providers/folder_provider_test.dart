import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/providers/folder.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:mocktail/mocktail.dart';

class _MockFolderService extends Mock implements FolderService {}

class _FakeRootFolder extends Fake implements RootFolder {}

void main() {
  setUpAll(() {
    registerFallbackValue(_FakeRootFolder());
    registerFallbackValue(SortOrder.asc);
  });

  group('folder providers', () {
    test('remote content changes refetch the active folder structure query', () async {
      final service = _MockFolderService();
      when(
        () => service.getFolderStructure(any()),
      ).thenAnswer((_) async => const RootFolder(subfolders: [], path: '/'));

      final container = ProviderContainer(overrides: [folderServiceProvider.overrideWithValue(service)]);
      addTearDown(container.dispose);

      await container.read(folderStructureProvider.notifier).fetchFolders(SortOrder.asc);
      verify(() => service.getFolderStructure(SortOrder.asc)).called(1);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      await Future<void>.delayed(const Duration(milliseconds: 5));

      verify(() => service.getFolderStructure(SortOrder.asc)).called(1);
    });

    test('remote content changes refetch active folder assets', () async {
      final service = _MockFolderService();
      const folder = RecursiveFolder(name: 'Camera', path: '', subfolders: []);
      when(() => service.getFolderAssets(any(), any())).thenAnswer((_) async => const []);

      final container = ProviderContainer(overrides: [folderServiceProvider.overrideWithValue(service)]);
      addTearDown(container.dispose);

      await container.read(folderRenderListProvider(folder).notifier).fetchAssets(SortOrder.desc);
      verify(() => service.getFolderAssets(folder, SortOrder.desc)).called(1);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      await Future<void>.delayed(const Duration(milliseconds: 5));

      verify(() => service.getFolderAssets(folder, SortOrder.desc)).called(1);
    });
  });
}
