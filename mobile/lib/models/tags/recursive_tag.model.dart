import 'package:immich_mobile/models/tags/root_tag.model.dart';

class RecursiveTag extends RootTag {
  final String name;

  RecursiveTag({
    required this.name,
    required super.path,
    required super.subfolders,
  });
}
