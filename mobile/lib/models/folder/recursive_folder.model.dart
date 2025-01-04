import 'package:immich_mobile/models/folder/root_folder.model.dart';

class RecursiveFolder extends RootFolder {
  final String name;
  final String path;

  RecursiveFolder({
    required this.path,
    required this.name,
    required super.subfolders,
  });
}
