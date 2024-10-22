import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';

class RenderList {
  final List<RenderListElement> elements;
  late final int totalCount;
  final DateTime modifiedTime;

  RenderList({required this.elements, required this.modifiedTime}) {
    final lastAssetElement =
        elements.whereType<RenderListAssetElement>().lastOrNull;
    if (lastAssetElement == null) {
      totalCount = 0;
    } else {
      totalCount = lastAssetElement.assetCount + lastAssetElement.assetOffset;
    }
  }

  factory RenderList.empty() {
    return RenderList(elements: [], modifiedTime: DateTime.now());
  }

  @override
  String toString() =>
      'RenderList(totalCount: $totalCount, modifiedTime: $modifiedTime)';

  @override
  bool operator ==(covariant RenderList other) {
    if (identical(this, other)) return true;

    return other.totalCount == totalCount &&
        other.modifiedTime.isAtSameMomentAs(modifiedTime);
  }

  @override
  int get hashCode => totalCount.hashCode ^ modifiedTime.hashCode;
}
