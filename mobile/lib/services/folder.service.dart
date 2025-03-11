import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
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

  Future<RootFolder> getFolderStructure(SortOrder order) async {
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
              subfolders: [],
            ),
          );
          // Sort folders based on order parameter
          folderMap[parentPath]!.sort(
            (a, b) => order == SortOrder.desc
                ? b.name.compareTo(a.name)
                : a.name.compareTo(b.name),
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
        // Sort subfolders based on order parameter
        folder.subfolders.sort(
          (a, b) => order == SortOrder.desc
              ? b.name.compareTo(a.name)
              : a.name.compareTo(b.name),
        );
        for (var subfolder in folder.subfolders) {
          attachSubfolders(subfolder);
        }
      }
    }

    List<RecursiveFolder> rootSubfolders = folderMap['_root_'] ?? [];
    // Sort root subfolders based on order parameter
    rootSubfolders.sort(
      (a, b) => order == SortOrder.desc
          ? b.name.compareTo(a.name)
          : a.name.compareTo(b.name),
    );

    for (var folder in rootSubfolders) {
      attachSubfolders(folder);
    }

    return RootFolder(
      subfolders: rootSubfolders,
      path: '/',
    );
  }

  Future<List<Asset>> getFolderAssets(
    RootFolder folder,
    SortOrder order,
  ) async {
    try {
      if (folder is RecursiveFolder) {
        String fullPath =
            folder.path.isEmpty ? folder.name : '${folder.path}/${folder.name}';
        fullPath = fullPath[0] == '/' ? fullPath.substring(1) : fullPath;
        var result = await _folderApiRepository.getAssetsForPath(fullPath);

        if (order == SortOrder.desc) {
          result.sort((a, b) => b.fileCreatedAt.compareTo(a.fileCreatedAt));
        } else {
          result.sort((a, b) => a.fileCreatedAt.compareTo(b.fileCreatedAt));
        }

        return result;
      }
      final result = await _folderApiRepository.getAssetsForPath('/');
      return result;
    } catch (e, stack) {
      _log.severe(
        "Failed to fetch assets for folder ${folder is RecursiveFolder ? folder.name : "root"}",
        e,
        stack,
      );
      return [];
    }
  }
}
