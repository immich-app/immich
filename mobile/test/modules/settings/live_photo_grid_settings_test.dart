@Tags(['widget'])
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart' show IStoreRepository;
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/group_divider_title.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid_view.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_group_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_layout_settings.dart';

import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';

void main() {
  late _InMemoryStoreRepository repository;

  final renderList = RenderList(
    [
      RenderAssetGridElement(
        RenderAssetGridElementType.assets,
        date: DateTime(2024, 1, 1),
        count: 1,
        totalCount: 1,
        offset: 0,
      ),
    ],
    null,
    [
      Asset(
        checksum: 'checksum',
        localId: '1',
        ownerId: 1,
        fileCreatedAt: DateTime(2024, 1, 1),
        fileModifiedAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 1, 1),
        durationInSeconds: 0,
        type: AssetType.image,
        fileName: 'asset.jpg',
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
      ),
    ],
  );

  setUpAll(() async {
    TestUtils.init();
    repository = _InMemoryStoreRepository();
    await StoreService.init(storeRepository: repository);
  });

  setUp(() async {
    await Store.clear();
    await Store.put(StoreKey.tilesPerRow, 4);
    await Store.put(StoreKey.dynamicLayout, false);
    await Store.put(StoreKey.groupAssetsBy, GroupAssetsBy.day.index);
    await Store.put(StoreKey.betaTimeline, false);
  });

  testWidgets('ImmichAssetGrid reacts to live tiles-per-row and layout changes', (tester) async {
    await tester.pumpConsumerWidget(ImmichAssetGrid(renderList: renderList));
    await tester.pumpAndSettle();

    var gridView = tester.widget<ImmichAssetGridView>(find.byType(ImmichAssetGridView));
    expect(gridView.assetsPerRow, 4);
    expect(gridView.dynamicLayout, isFalse);

    await Store.put(StoreKey.tilesPerRow, 5);
    await Store.put(StoreKey.dynamicLayout, true);
    await tester.pumpAndSettle();

    gridView = tester.widget<ImmichAssetGridView>(find.byType(ImmichAssetGridView));
    expect(gridView.assetsPerRow, 5);
    expect(gridView.dynamicLayout, isTrue);
  });

  testWidgets('GroupDividerTitle reacts to live group setting changes', (tester) async {
    await tester.pumpConsumerWidget(
      const GroupDividerTitle(
        text: 'January',
        multiselectEnabled: false,
        onSelect: _noop,
        onDeselect: _noop,
        selected: false,
      ),
    );
    await tester.pumpAndSettle();

    var padding = tester.widget<Padding>(
      find.descendant(of: find.byType(GroupDividerTitle), matching: find.byType(Padding)).first,
    );
    expect((padding.padding as EdgeInsets).top, 16.0);

    await Store.put(StoreKey.groupAssetsBy, GroupAssetsBy.month.index);
    await tester.pumpAndSettle();

    padding = tester.widget<Padding>(
      find.descendant(of: find.byType(GroupDividerTitle), matching: find.byType(Padding)).first,
    );
    expect((padding.padding as EdgeInsets).top, 32.0);
  });

  testWidgets('GroupSettings writes the selected group value', (tester) async {
    await tester.pumpConsumerWidget(const GroupSettings());
    await tester.pumpAndSettle();

    await tester.tap(
      find.byWidgetPredicate((widget) => widget is RadioListTile<GroupAssetsBy> && widget.value == GroupAssetsBy.month),
    );
    await tester.pumpAndSettle();

    expect(Store.get(StoreKey.groupAssetsBy, GroupAssetsBy.day.index), GroupAssetsBy.month.index);
  });

  testWidgets('LayoutSettings writes dynamic layout and tiles per row', (tester) async {
    await tester.pumpConsumerWidget(const LayoutSettings());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(Store.get(StoreKey.dynamicLayout, false), isTrue);

    final slider = tester.widget<Slider>(find.byType(Slider));
    slider.onChanged?.call(5.0);
    slider.onChangeEnd?.call(5.0);
    await tester.pumpAndSettle();

    expect(Store.get(StoreKey.tilesPerRow, 4), 5);
  });
}

void _noop() {}

class _InMemoryStoreRepository implements IStoreRepository {
  final Map<StoreKey<Object?>, Object?> _values = {};
  final StreamController<List<StoreDto<Object>>> _allController = StreamController.broadcast();
  final Map<StoreKey<Object?>, StreamController<Object?>> _controllers = {};

  @override
  Future<bool> deleteAll() async {
    _values.clear();
    for (final controller in _controllers.values) {
      controller.add(null);
    }
    _emitAll();
    return true;
  }

  @override
  Future<void> delete<T>(StoreKey<T> key) async {
    _values.remove(key as StoreKey<Object?>);
    _controllerFor(key).add(null);
    _emitAll();
  }

  @override
  Future<List<StoreDto<Object>>> getAll() async => _snapshot();

  @override
  Future<T?> tryGet<T>(StoreKey<T> key) async => _values[key as StoreKey<Object?>] as T?;

  @override
  Future<bool> upsert<T>(StoreKey<T> key, T value) async {
    _values[key as StoreKey<Object?>] = value;
    _controllerFor(key).add(value);
    _emitAll();
    return true;
  }

  @override
  Stream<T?> watch<T>(StoreKey<T> key) async* {
    yield _values[key as StoreKey<Object?>] as T?;
    yield* _controllerFor(key).stream.cast<T?>();
  }

  @override
  Stream<List<StoreDto<Object>>> watchAll() async* {
    yield _snapshot();
    yield* _allController.stream;
  }

  StreamController<Object?> _controllerFor<T>(StoreKey<T> key) {
    final objectKey = key as StoreKey<Object?>;
    return _controllers.putIfAbsent(objectKey, () => StreamController<Object?>.broadcast());
  }

  void _emitAll() {
    _allController.add(_snapshot());
  }

  List<StoreDto<Object>> _snapshot() {
    return _values.entries.map((entry) => StoreDto<Object>(entry.key as StoreKey<Object>, entry.value)).toList();
  }
}
