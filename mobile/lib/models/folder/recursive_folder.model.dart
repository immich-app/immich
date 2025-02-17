import 'package:immich_mobile/models/folder/root_folder.model.dart';

class RecursiveFolder extends RootFolder {
  final String name;

  RecursiveFolder({
    required this.name,
    required super.path,
    required super.subfolders,
  });
}
