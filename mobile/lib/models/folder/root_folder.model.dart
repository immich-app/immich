import 'package:immich_mobile/models/folder/recursive_folder.model.dart';

class RootFolder {
  final List<RecursiveFolder> subfolders;

  RootFolder({
    required this.subfolders,
  });
}
