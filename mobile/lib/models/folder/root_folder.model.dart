import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';

class RootFolder {
  final List<Asset>? assets;
  final List<RecursiveFolder> subfolders;

  RootFolder({
    required this.assets,
    required this.subfolders,
  });
}
