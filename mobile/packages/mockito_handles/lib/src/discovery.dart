import 'package:analyzer/dart/element/element.dart';

/// A type that has a `class MockX extends Mock implements <target>` declaration.
///
/// These are read out of mockito's own build output. Going through the resolved
/// element model rather than the generated text means the mock class name comes
/// from the element (so a `MockSpec(as: …)` rename is picked up for free) and,
/// more importantly, the `implements` clause hands over the **real interface
/// element** — the source of true parameter nullability, real default values and
/// inherited members. mockito's generated override cannot supply any of those,
/// because it widens every non-nullable parameter to nullable.
class MockTarget {
  MockTarget(this.element, this.mockClass);

  /// The interface being mocked, e.g. `AlbumRepository`.
  final InterfaceElement element;

  /// mockito's generated class, e.g. `MockAlbumRepository`.
  final String mockClass;

  /// The interface's simple name.
  ///
  /// Only an unnamed extension type has no name, and one cannot be mocked, so
  /// the fallback exists to keep this non-nullable rather than to be seen.
  String get name => element.name ?? 'Unnamed';
}

/// Every mock class declared in [library], sorted by target name.
List<MockTarget> targetsIn(LibraryElement library, {void Function(String message)? onWarning}) {
  final targets = <MockTarget>[];
  for (final cls in library.classes) {
    final mockClass = cls.name;
    if (mockClass == null || !_extendsMock(cls)) continue;

    // mockito emits `_FakeX extends SmartFake implements Y` alongside the mocks;
    // those do not extend Mock, so they never reach here.
    if (cls.interfaces.length != 1) {
      onWarning?.call('$mockClass does not implement exactly one interface — skipped');
      continue;
    }
    final target = cls.interfaces.single.element;
    if (target.isPrivate) {
      onWarning?.call('$mockClass targets a private type — skipped');
      continue;
    }
    targets.add(MockTarget(target, mockClass));
  }
  targets.sort((a, b) => a.name.compareTo(b.name));
  return targets;
}

/// True only for a **mockito** mock.
///
/// The package check is load-bearing rather than defensive. `mocktail` declares
/// a base class called `Mock` too, and a project migrating between the two will
/// have both kinds of declaration in files ending `.mocks.dart` — exactly the
/// inputs this builder is applied to. Handles are emitted against mockito's
/// parameter widening, which mocktail does not do, so a handle over a mocktail
/// mock makes every argument a type error. Matching on the class name alone is
/// not enough.
bool _extendsMock(ClassElement cls) {
  for (var type = cls.supertype; type != null; type = type.element.supertype) {
    final element = type.element;
    if (element.name == 'Mock' && element.library.uri.pathSegments.firstOrNull == 'mockito') {
      return true;
    }
  }
  return false;
}
