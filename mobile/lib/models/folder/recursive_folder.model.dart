import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/folder.service.dart';

class RecursiveFolder {
  final String name;
  final String path;
  List<Asset>? assets;
  final List<RecursiveFolder> subfolders;
  final FolderService _folderService;

  RecursiveFolder({
    required this.path,
    required this.name,
    this.assets,
    required this.subfolders,
    required folderService,
  }) : _folderService = folderService;

  Future<void> fetchAssets() async {
    final result = await _folderService.getFolderAssets(this);

    if (result is AsyncData) {
      assets = result.value;
    }
  }
}
