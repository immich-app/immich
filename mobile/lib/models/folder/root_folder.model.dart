import 'package:immich_mobile/models/folder/recursive_folder.model.dart';

class RootFolder {
  final List<RecursiveFolder> subfolders;
  final String path;

  const RootFolder({
    required this.subfolders,
    required this.path,
  });
}
