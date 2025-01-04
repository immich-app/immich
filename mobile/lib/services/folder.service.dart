import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/repositories/folder_api.repository.dart';
import 'package:logging/logging.dart';

final folderServiceProvider = Provider(
  (ref) => FolderService(ref.watch(folderApiRepositoryProvider)),
);

class FolderService {
  final FolderApiRepository _folderApiRepository;
  final Logger _log = Logger("FolderService");

  FolderService(this._folderApiRepository);

  Future<RootFolder> getFolderStructure() async {
    final paths = await _folderApiRepository.getAllUniquePaths();

    // Create folder structure
    Map<String, List<RecursiveFolder>> folderMap = {};

    for (String fullPath in paths) {
      if (fullPath == '/') continue;

      // Ensure the path starts with a slash
      if (!fullPath.startsWith('/')) {
        fullPath = '/$fullPath';
      }

      List<String> segments = fullPath.split('/')
        ..removeWhere((s) => s.isEmpty);

      String currentPath = '';

      for (int i = 0; i < segments.length; i++) {
        String parentPath = currentPath.isEmpty ? '_root_' : currentPath;
        currentPath =
            i == 0 ? '/${segments[i]}' : '$currentPath/${segments[i]}';

        if (!folderMap.containsKey(parentPath)) {
          folderMap[parentPath] = [];
        }

        if (!folderMap[parentPath]!.any((f) => f.name == segments[i])) {
          folderMap[parentPath]!.add(
            RecursiveFolder(
              path: parentPath == '_root_' ? '' : parentPath,
              name: segments[i],
              // assets: null,
              subfolders: [],
            ),
          );
        }
      }
    }

    void attachSubfolders(RecursiveFolder folder) {
      String fullPath = folder.path.isEmpty
          ? '/${folder.name}'
          : '${folder.path}/${folder.name}';

      if (folderMap.containsKey(fullPath)) {
        folder.subfolders.addAll(folderMap[fullPath]!);
        for (var subfolder in folder.subfolders) {
          attachSubfolders(subfolder);
        }
      }
    }

    List<RecursiveFolder> rootSubfolders = folderMap['_root_'] ?? [];
    for (var folder in rootSubfolders) {
      attachSubfolders(folder);
    }

    return RootFolder(
      subfolders: rootSubfolders,
    );
  }

  Future<List<Asset>> getFolderAssets(RootFolder folder) async {
    try {
      if (folder is RecursiveFolder) {
        final fullPath = folder.path.isEmpty
            ? '/${folder.name}'
            : '${folder.path}/${folder.name}';
        final result = await _folderApiRepository.getAssetsForPath(fullPath);
        print("Assets for folder $fullPath: $result");
        return result;
      }
      final result = await _folderApiRepository.getAssetsForPath('/');
      print("Assets for root: $result");
      return result;
    } catch (e, stack) {
      _log.severe(
          "Failed to fetch assets for folder ${folder is RecursiveFolder ? folder.name : "root"}",
          e,
          stack);
      return [];
    }
  }
}
