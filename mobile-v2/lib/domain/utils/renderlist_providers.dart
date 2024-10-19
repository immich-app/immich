import 'dart:async';

import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/renderlist.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/service_locator.dart';

typedef RenderListStreamProvider = Stream<RenderList> Function();
typedef RenderListAssetProvider = FutureOr<List<Asset>> Function({
  int? offset,
  int? limit,
});

class RenderListProvider {
  final RenderListStreamProvider renderStreamProvider;
  final RenderListAssetProvider renderAssetProvider;

  const RenderListProvider({
    required this.renderStreamProvider,
    required this.renderAssetProvider,
  });

  factory RenderListProvider.mainTimeline() => RenderListProvider(
        renderStreamProvider: () => di<IRenderListRepository>().watchAll(),
        renderAssetProvider: di<IAssetRepository>().getAll,
      );
}
