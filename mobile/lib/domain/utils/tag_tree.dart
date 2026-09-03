import 'package:immich_mobile/domain/models/tag.model.dart';

/// Tags are stored as flat values with `/`-delimited paths.
/// This builds a tree from them so the UI can browse them as a drill-down explorer.
class TagTreeNode {
  final String value;
  final String path;
  final TagTreeNode? parent;
  final Map<String, TagTreeNode> _children;

  String? id;
  String? color;

  TagTreeNode._(this.value, this.path, this.parent) : _children = {};

  List<TagTreeNode> get children => _children.values.toList(growable: false);

  bool get hasChildren => _children.isNotEmpty;

  TagTreeNode traverse(String path) {
    var current = this;
    for (final part in _pathParts(path)) {
      final next = current._children[part];
      if (next == null) {
        break;
      }
      current = next;
    }
    return current;
  }

  static TagTreeNode fromTags(Iterable<Tag> tags) {
    final root = TagTreeNode._('', '', null);
    for (final tag in tags) {
      final node = root._add(tag.value);
      node.id = tag.id;
      node.color = tag.color;
    }
    return root;
  }

  TagTreeNode _add(String path) {
    var current = this;
    for (final part in _pathParts(path)) {
      current = current._children.putIfAbsent(part, () => TagTreeNode._(part, _joinPaths(current.path, part), current));
    }
    return current;
  }
}

List<String> _pathParts(String path) => path.split('/').where((p) => p.isNotEmpty).toList();

String _joinPaths(String a, String b) {
  if (a.isEmpty) {
    return b;
  }
  if (b.isEmpty) {
    return a;
  }
  return '$a/$b';
}
