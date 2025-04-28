import 'package:immich_mobile/models/tags/recursive_tag.model.dart';
import 'package:openapi/api.dart';

class RootTag {
  final List<RecursiveTag> subfolders;
  final TagResponseDto path;

  RootTag({
    required this.subfolders,
    required this.path,
  });
}
