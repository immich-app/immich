import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// A reactive query of list data from a particular cache. This is scoped to the provided arguments
typedef CacheListQuery<TData, TScope> =
    AutoDisposeFamilyAsyncNotifierProvider<CacheNotifier<TData, TScope>, List<TData>, TScope>;

/// A future backed in-memory cache of lists of [TData], scoped by [TScope]
///
/// For every unique scope, the future is fetched on first listen and disposed when there are no more listeners.
/// Mutations are applied using [CachedStoreMutations.cacheUpsert] and [CachedStoreMutations.cacheRemove]
///
/// **NOTE:** Not intended for use with Drift tables; they provide their own persistence
abstract class StoreCache<TData, TScope> {
  /// Fetch the contents of [scope]
  @protected
  Future<List<TData>> fetch(Ref ref, TScope scope);

  /// The identity of [item]
  @protected
  Object identity(TData item);

  /// Whether the corresponding list for [scope] should contain [item]
  ///
  /// This is checked across all currently active scopes to keep each cache up to date with the latest changes. Each
  /// cache may change independently, thus we must verify that a given item is relevant to it
  @protected
  bool shouldContain(TScope scope, TData item);

  /// The provider family backing this cache
  late final family = AsyncNotifierProvider.autoDispose.family<CacheNotifier<TData, TScope>, List<TData>, TScope>(
    () => CacheNotifier._(this),
  );

  /// All active scopes, by count of live provider elements (one per container watching the scope)
  final Map<TScope, int> _liveScopes = {};

  /// Register a live provider element for [scope]
  void _addScope(TScope scope) {
    _liveScopes.update(scope, (count) => count + 1, ifAbsent: () => 1);
  }

  /// Unregister a live provider element for [scope]
  void _removeScope(TScope scope) {
    final count = _liveScopes[scope] ?? 0;
    if (count <= 1) {
      _liveScopes.remove(scope);
    } else {
      _liveScopes[scope] = count - 1;
    }
  }

  /// Patch and upsert in all scopes that will allow [item] given the result from [shouldContain]
  void _upsert(Ref ref, TData item) {
    final id = identity(item);
    _patchLive(
      ref,
      (scope, list) => shouldContain(scope, item) ? list._upsertWhere((i) => identity(i) == id, item) : list,
    );
  }

  /// Patch and remove [id] from all scopes that contain it
  void _remove(Ref ref, Object id) {
    _patchLive(ref, (scope, list) => list._without((i) => identity(i) == id));
  }

  /// Apply [transform] to all scopes
  void _patchLive(Ref ref, List<TData> Function(TScope scope, List<TData> current) transform) {
    for (final scope in [..._liveScopes.keys]) {
      // Guard against scopes registered by a different ProviderContainer (tests)
      if (ref.exists(family(scope))) {
        ref.read(family(scope).notifier)._patch((current) => transform(scope, current));
      }
    }
  }
}

/// A Riverpod [Notifier] built for handling an in-memory cache
class CacheNotifier<T, Arg> extends AutoDisposeFamilyAsyncNotifier<List<T>, Arg> {
  final StoreCache<T, Arg> _cache;

  CacheNotifier._(this._cache);

  @override
  Future<List<T>> build(Arg arg) {
    // Track each consumer of this notifier
    // Theoretically this could be called from different scopes (tests), so actually reference counting instead of relying on
    // Riverpod's deduping is necessary
    _cache._addScope(arg);
    ref.onDispose(() => _cache._removeScope(arg));

    return _cache.fetch(ref, arg);
  }

  /// Applies [transform] to the currently stored list
  ///
  /// If [transform] returns the same list, no state mutation occurs
  void _patch(List<T> Function(List<T> current) transform) {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    final result = transform(current);
    if (!identical(result, current)) {
      state = AsyncData(result);
    }
  }
}

/// Base for a store entry's mutations, to be exposed by the entry's provider via `ref.read(Store.x).doMutation()`
abstract class StoreMutations {
  final Ref _ref;

  const StoreMutations(this._ref);

  /// Read the state associated with a [provider]
  @protected
  T read<T>(ProviderListenable<T> provider) => _ref.read(provider);
}

/// Mutations for a store entry whose reads are backed by a [StoreCache]
///
/// Apply each mutation to the cache with [cacheUpsert] or [cacheRemove]
abstract class CachedStoreMutations<T, Arg> extends StoreMutations {
  final StoreCache<T, Arg> _cache;

  const CachedStoreMutations(super.ref, this._cache);

  /// Insert or update [item] in every live scope that [StoreCache.shouldContain] it
  @protected
  void cacheUpsert(T item) => _cache._upsert(_ref, item);

  /// Remove the item with identity [id] from every live scope
  @protected
  void cacheRemove(Object id) => _cache._remove(_ref, id);
}

/// Identity-preserving list edits
extension _ListEdits<T> on List<T> {
  /// Upsert [item] in the location specified by [matcher], or to the end if it is not found. Preserves list identity if there are no changes
  List<T> _upsertWhere(bool Function(T item) matcher, T item) {
    final index = indexWhere(matcher);

    if (index == -1) {
      // Append
      return [...this, item];
    } else if (this[index] != item) {
      // Update
      final list = [...this];
      list[index] = item;
      return list;
    } else {
      // Do nothing
      return this;
    }
  }

  /// Filter out items matching [matcher]. Preserves list identity if there are no changes
  List<T> _without(bool Function(T item) matcher) {
    final result = where((item) => !matcher(item)).toList();
    return result.length == length ? this : result;
  }
}
