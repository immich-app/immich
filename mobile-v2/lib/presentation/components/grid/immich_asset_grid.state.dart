import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

typedef RenderListProvider = Stream<RenderList> Function();
typedef RenderListAssetProvider = FutureOr<List<Asset>> Function({
  int? offset,
  int? limit,
});

class ImmichAssetGridCubit extends Cubit<RenderList> {
  final Stream<RenderList> _renderStream;
  final RenderListAssetProvider _assetProvider;
  late final StreamSubscription _renderListSubscription;

  /// offset of the assets from last section in [_buf]
  int _bufOffset = 0;

  /// assets cache loaded from DB with offset [_bufOffset]
  List<Asset> _buf = [];

  ImmichAssetGridCubit({
    required Stream<RenderList> renderStream,
    required RenderListAssetProvider assetProvider,
  })  : _renderStream = renderStream,
        _assetProvider = assetProvider,
        super(RenderList.empty()) {
    _renderListSubscription = _renderStream.listen((renderList) {
      _bufOffset = 0;
      _buf = [];
      emit(renderList);
    });
  }

  /// Loads the requested assets from the database to an internal buffer if not cached
  /// and returns a slice of that buffer
  Future<List<Asset>> loadAssets(int offset, int count) async {
    assert(offset >= 0);
    assert(count > 0);
    assert(offset + count <= state.totalCount);

    // the requested slice (offset:offset+count) is not contained in the cache buffer `_buf`
    // thus, fill the buffer with a new batch of assets that at least contains the requested
    // assets and some more
    if (offset < _bufOffset || offset + count > _bufOffset + _buf.length) {
      final bool forward = _bufOffset < offset;

      // make sure to load a meaningful amount of data (and not only the requested slice)
      // otherwise, each call to [loadAssets] would result in DB call trashing performance
      // fills small requests to [batchSize], adds some legroom into the opposite scroll direction for large requests
      final len =
          math.max(kRenderListBatchSize, count + kRenderListOppositeBatchSize);

      // when scrolling forward, start shortly before the requested offset...
      // when scrolling backward, end shortly after the requested offset...
      // ... to guard against the user scrolling in the other direction
      // a tiny bit resulting in a another required load from the DB
      final start = math.max(
        0,
        forward
            ? offset - kRenderListOppositeBatchSize
            : (len > kRenderListBatchSize ? offset : offset + count - len),
      );

      // load the calculated batch (start:start+len) from the DB and put it into the buffer
      _buf = await _assetProvider(offset: start, limit: len);
      _bufOffset = start;

      assert(_bufOffset <= offset);
      assert(_bufOffset + _buf.length >= offset + count);
    }

    // return the requested slice from the buffer (we made sure before that the assets are loaded!)
    return _buf.slice(offset - _bufOffset, offset - _bufOffset + count);
  }

  @override
  Future<void> close() {
    _renderListSubscription.cancel();
    return super.close();
  }
}
