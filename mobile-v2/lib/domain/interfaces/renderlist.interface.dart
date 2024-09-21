import 'package:immich_mobile/domain/models/render_list.model.dart';

abstract interface class IRenderListRepository {
  /// Streams the [RenderList] for the main timeline
  Stream<RenderList> watchAll();
}
