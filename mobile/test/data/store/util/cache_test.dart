import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store/util/cache.dart';

typedef _Item = ({String id, String scope, int version});

_Item _item(String id, String scope, [int version = 1]) => (id: id, scope: scope, version: version);

class _TestCache extends StoreCache<_Item, String> {
  final fetchLog = <String>[];
  final seed = <String, List<_Item>>{};

  @override
  Future<List<_Item>> fetch(Ref ref, String scope) async {
    fetchLog.add(scope);
    return seed[scope] ?? const [];
  }

  @override
  Object identity(_Item item) => item.id;

  @override
  bool shouldContain(String scope, _Item item) => item.scope == scope;
}

class _TestMutations extends CachedStoreMutations<_Item, String> {
  const _TestMutations(super.ref, super.cache);

  void upsert(_Item item) => cacheUpsert(item);

  void removeById(Object id) => cacheRemove(id);
}

void main() {
  late _TestCache cache;
  late ProviderContainer container;
  late _TestMutations mutations;

  setUp(() {
    cache = _TestCache();
    container = ProviderContainer();
    mutations = container.read(Provider((ref) => _TestMutations(ref, cache)));
    addTearDown(container.dispose);
  });

  /// Keeps [scope] alive in [target] for the test's duration, collecting state changes
  List<AsyncValue<List<_Item>>> listen(String scope, [ProviderContainer? target]) {
    final states = <AsyncValue<List<_Item>>>[];
    (target ?? container).listen(cache.family(scope), (_, next) => states.add(next));
    return states;
  }

  Future<List<_Item>> load(String scope, [ProviderContainer? target]) =>
      (target ?? container).read(cache.family(scope).future);

  List<_Item>? current(String scope) => container.read(cache.family(scope)).value;

  test('fetches once per live scope, and refetches on new subscription after its last listener disconnected', () async {
    final first = container.listen(cache.family('a'), (_, _) {});
    final second = container.listen(cache.family('a'), (_, _) {});

    await load('a');
    expect(cache.fetchLog, ['a']);

    first.close();
    await container.pump();
    expect(cache.fetchLog, ['a']);

    second.close();
    await container.pump();

    listen('a');
    await load('a');

    expect(cache.fetchLog, ['a', 'a']);
  });

  test('upsert inserts or updates by identity, limited to shouldContain', () async {
    cache.seed['a'] = [_item('1', 'a', 1)];
    listen('a');
    listen('b');

    await load('a');
    await load('b');

    // Update existing
    mutations.upsert(_item('1', 'a', 2));

    // Insert new
    mutations.upsert(_item('2', 'a'));

    // No scope
    mutations.upsert(_item('3', 'c'));

    expect(current('a'), [_item('1', 'a', 2), _item('2', 'a')]);
    expect(current('b'), isEmpty);

    expect(cache.fetchLog, ['a', 'b']);
  });

  test('remove drops the item from all live scopes', () async {
    cache.seed['a'] = [_item('x', 'a')];
    cache.seed['b'] = [_item('x', 'b'), _item('y', 'b')];

    listen('a');
    listen('b');
    await load('a');
    await load('b');

    mutations.removeById('x');

    expect(current('a'), isEmpty);
    expect(current('b'), [_item('y', 'b')]);
  });

  test('patches that change nothing do not emit', () async {
    cache.seed['a'] = [_item('1', 'a')];

    final states = listen('a');
    await load('a');
    final oldStateCount = states.length;

    mutations.upsert(_item('1', 'a'));
    mutations.removeById('nope');

    expect(states.length, oldStateCount);
  });

  test('patches scopes that are live in other Riverpod containers', () async {
    final other = ProviderContainer();

    listen('a', other);
    await load('a', other);

    listen('a');
    await load('a');

    // We kill the external container, but ours (the second reference) should still work
    other.dispose();
    await container.pump();

    mutations.upsert(_item('1', 'a'));

    expect(current('a'), [_item('1', 'a')]);
  });
}
