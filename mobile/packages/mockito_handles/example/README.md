# Example

A complete walkthrough, from a plain interface to a test that stubs and verifies
it without a single argument matcher.

## 1. The code under test

```dart
// lib/album_repository.dart
class Asset {
  const Asset(this.id);
  final String id;
}

class AlbumRepository {
  Future<List<Asset>> assetsIn(String albumId) async => const [];
  Future<void> markHashed(List<String> ids, {bool force = false}) async {}
  int get pendingCount => 0;
}
```

```dart
// lib/hash_service.dart
import 'album_repository.dart';

class HashService {
  HashService(this._albums);
  final AlbumRepository _albums;

  Future<int> hash(String albumId) async {
    final assets = await _albums.assetsIn(albumId);
    if (assets.isEmpty) return 0;
    await _albums.markHashed([for (final a in assets) a.id]);
    return assets.length;
  }
}
```

## 2. Declare the mock

Exactly as for `mockito` alone — this package adds no annotation of its own.

```dart
// test/mocks.dart
import 'package:mockito/annotations.dart';
import 'package:my_app/album_repository.dart';

@GenerateNiceMocks([MockSpec<AlbumRepository>()])
void main() {}
```

## 3. Generate

```sh
dart run build_runner build
```

Two files appear next to `mocks.dart`: `mocks.mocks.dart` from `mockito`, and
`mocks.handles.dart` from this package.

## 4. The test

```dart
// test/hash_service_test.dart
import 'package:my_app/album_repository.dart';
import 'package:my_app/hash_service.dart';
import 'package:test/test.dart';

import 'mocks.handles.dart';

void main() {
  late AlbumRepositoryMock albums;
  late HashService sut;

  setUp(() {
    // One per test. A fresh mock has no stubs and no recorded calls, so there is
    // nothing to reset.
    albums = AlbumRepositoryMock();
    sut = HashService(albums.mock);
  });

  test('hashes every asset the album reports', () async {
    albums.assetsIn.mockResolvedValue([const Asset('a1'), const Asset('a2')]);

    expect(await sut.hash('album-1'), 2);

    // Real values, type-checked. `calledWith(1)` would not compile.
    albums.assetsIn.calledWith('album-1');
    albums.markHashed.calledWith(['a1', 'a2']);
  });

  test('does nothing when the album is empty', () async {
    // No stub needed: @GenerateNiceMocks already returns [] for Future<List<T>>.
    expect(await sut.hash('album-1'), 0);

    albums.markHashed.not.called();
  });

  test('an argument-dependent stub reads as ordinary Dart', () async {
    const byAlbum = {
      'album-1': [Asset('a1')],
      'album-2': [Asset('a2'), Asset('a3')],
    };
    // `fn` receives the real typed argument, not an Invocation.
    albums.assetsIn.mockImplementation((albumId) async => byAlbum[albumId] ?? const []);

    expect(await sut.hash('album-1'), 1);
    expect(await sut.hash('album-2'), 2);
    expect(await sut.hash('album-3'), 0);
  });

  test('a matcher goes where a value would', () async {
    albums.assetsIn.mockResolvedValue([const Asset('a1')]);

    await sut.hash('album-1');

    // Each argument may be a value or a Matcher; omitted means "any".
    albums.markHashed.calledWithMatching(ids: hasLength(1));
  });

  test('failure propagates', () async {
    albums.assetsIn.mockRejectedValue(StateError('offline'));

    await expectLater(sut.hash('album-1'), throwsStateError);
  });

  test('a getter is read, not called', () {
    albums.pendingCount.mockReturnValue(7);

    expect(albums.mock.pendingCount, 7);

    albums.pendingCount.calledOnce();
  });
}
```

## 5. Reaching past the handles

`markHashed` has a named parameter, so its captured arguments are grouped per
call. `captured` is flat across every call, so for arity > 1 use `calls` — and
read it **once**, because every verification consumes the calls it matches:

```dart
final call = albums.markHashed.calls.single;
final ids = call[0] as List<String>;
final force = call[1] as bool;
```

And anything the handles do not model — `verifyInOrder` across two mocks, for
instance — works on `.mock` with plain `mockito`:

```dart
verifyInOrder([
  albums.mock.assetsIn('album-1'),
  albums.mock.markHashed(['a1', 'a2']),
]);
```
