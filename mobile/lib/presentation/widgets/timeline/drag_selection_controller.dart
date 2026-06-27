import 'dart:collection';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

// Tracks the [anchor..current] range selected by a drag. The in-buffer part of
// each tick is selected synchronously so it follows the finger without racing;
// the rare beyond-buffer part is read async (applied only if still in range) and
// [end] reads whatever is still missing so the final range always lands.
class DragSelectionController {
  DragSelectionController({required this.getAssetSafe, required this.getAssetsRange, required this.onChange});

  final BaseAsset? Function(int index) getAssetSafe;
  final Future<List<BaseAsset>> Function(int index, int count) getAssetsRange;
  final void Function(Set<BaseAsset> select, Set<BaseAsset> deselect) onChange;

  final HashMap<int, BaseAsset> _selected = HashMap();
  // Indices the buffer didn't hold yet (the edge outran the async buffer-load on a
  // fast scroll); read in by _extendPending and guaranteed by end().
  final Set<int> _pending = {};
  int? _anchor;
  int? _lo;
  int? _hi;
  bool _disposed = false;

  // Call before starting a new drag so a previous drag's in-flight read can't
  // leak into the new selection.
  void dispose() => _disposed = true;

  void _emit(Set<BaseAsset> select, Set<BaseAsset> deselect) {
    if (_disposed) {
      return;
    }
    onChange(select, deselect);
  }

  void start(int anchor) {
    _selected.clear();
    _pending.clear();
    _anchor = anchor;
    _lo = anchor;
    _hi = anchor;
    _select(anchor);
    _extendPending();
  }

  void enter(int current) {
    final anchor = _anchor;
    if (anchor == null || _lo == null || _hi == null) {
      return;
    }
    final ns = current < anchor ? current : anchor;
    final ne = current < anchor ? anchor : current;
    final ps = _lo!;
    final pe = _hi!;
    if (ns == ps && ne == pe) {
      return;
    }

    final toSelect = <BaseAsset>{};
    final toDeselect = <BaseAsset>{};

    _forEach(ps, ns - 1, (k) => _removeIndex(k, toDeselect));
    _forEach(ne + 1, pe, (k) => _removeIndex(k, toDeselect));
    _forEach(ns, ps - 1, (k) => _addIndex(k, toSelect));
    _forEach(pe + 1, ne, (k) => _addIndex(k, toSelect));

    _lo = ns;
    _hi = ne;

    if (toSelect.isNotEmpty || toDeselect.isNotEmpty) {
      _emit(toSelect, toDeselect);
    }
    _extendPending();
  }

  Future<void> end() async {
    final lo = _lo;
    final hi = _hi;
    if (lo == null || hi == null) {
      return;
    }
    final missing = <int>[];
    for (var k = lo; k <= hi; k++) {
      if (!_selected.containsKey(k)) {
        missing.add(k);
      }
    }
    if (missing.isEmpty) {
      return;
    }
    final from = missing.first;
    final assets = await getAssetsRange(from, missing.last - from + 1);
    final missingSet = missing.toSet();
    final toSelect = <BaseAsset>{};
    for (var i = 0; i < assets.length; i++) {
      final idx = from + i;
      if (missingSet.contains(idx) && !_selected.containsKey(idx)) {
        _selected[idx] = assets[i];
        _pending.remove(idx);
        toSelect.add(assets[i]);
      }
    }
    if (toSelect.isNotEmpty) {
      _emit(toSelect, const {});
    }
  }

  void _select(int index) {
    final asset = getAssetSafe(index);
    if (asset != null) {
      _selected[index] = asset;
      _pending.remove(index);
      _emit({asset}, const {});
    } else {
      _pending.add(index);
    }
  }

  void _addIndex(int index, Set<BaseAsset> toSelect) {
    if (_selected.containsKey(index)) {
      return;
    }
    final asset = getAssetSafe(index);
    if (asset != null) {
      _selected[index] = asset;
      _pending.remove(index);
      toSelect.add(asset);
    } else {
      _pending.add(index);
    }
  }

  void _removeIndex(int index, Set<BaseAsset> toDeselect) {
    _pending.remove(index);
    final asset = _selected.remove(index);
    if (asset != null) {
      toDeselect.add(asset);
    }
  }

  Future<void> _extendPending() async {
    if (_pending.isEmpty) {
      return;
    }
    var from = _pending.first;
    var to = _pending.first;
    for (final k in _pending) {
      if (k < from) {
        from = k;
      }
      if (k > to) {
        to = k;
      }
    }
    final assets = await getAssetsRange(from, to - from + 1);
    final toSelect = <BaseAsset>{};
    for (var i = 0; i < assets.length; i++) {
      final idx = from + i;
      if (_pending.contains(idx) && _lo != null && idx >= _lo! && idx <= _hi!) {
        _selected[idx] = assets[i];
        toSelect.add(assets[i]);
      }
    }
    _pending.removeWhere((idx) => _selected.containsKey(idx));
    if (toSelect.isNotEmpty) {
      _emit(toSelect, const {});
    }
  }

  void _forEach(int lo, int hi, void Function(int) fn) {
    for (var k = lo; k <= hi; k++) {
      fn(k);
    }
  }
}
