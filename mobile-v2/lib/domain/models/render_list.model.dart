import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';

class RenderList {
  final List<RenderListElement> elements;
  late final int totalCount;

  RenderList({required this.elements}) {
    final lastAssetElement =
        elements.whereType<RenderListAssetElement>().lastOrNull;
    if (lastAssetElement == null) {
      totalCount = 0;
    } else {
      totalCount = lastAssetElement.assetCount + lastAssetElement.assetOffset;
    }
  }

  factory RenderList.empty() {
    return RenderList(elements: []);
  }
}
