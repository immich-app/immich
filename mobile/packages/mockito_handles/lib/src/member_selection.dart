import 'package:analyzer/dart/element/element.dart';
import 'package:analyzer/dart/element/type.dart';

enum MemberKind { method, getter, setter }

class SelectedMember {
  SelectedMember({
    required this.name,
    required this.kind,
    required this.returnType,
    required this.parameters,
    required this.typeParameters,
  });

  final String name;
  final MemberKind kind;
  final DartType returnType;
  final List<FormalParameterElement> parameters;
  final List<TypeParameterElement> typeParameters;

  /// Whether the member returns a `Future` or `FutureOr` from `dart:async`.
  ///
  /// The library check matters: a user type of their own called `Future` would
  /// otherwise be stubbed with `mockResolvedValue`, emitting `(_) async => value`
  /// for a member that returns something no `await` can produce.
  bool get isAsync => _asyncName != null;

  /// Whether the member returns `FutureOr<T>` rather than `Future<T>`.
  ///
  /// The distinction matters to stubbing: a `FutureOr<T>` may be satisfied by a
  /// bare `T`, so it needs a synchronous stub as well as an asynchronous one.
  bool get isFutureOr => _asyncName == 'FutureOr';

  String? get _asyncName {
    final type = returnType;
    if (type is! InterfaceType) return null;
    final name = type.element.name;
    if (name != 'Future' && name != 'FutureOr') return null;
    return type.element.library.uri.toString() == 'dart:async' ? name : null;
  }
}

class SkippedMember {
  SkippedMember(this.name, this.reason);
  final String name;
  final String reason;
}

/// Selects the members of [target] worth a handle.
///
/// [ownedPackages] is the supertype rule, and it is deliberately origin-based
/// rather than a denylist of foreign types — a denylist would rot. A member is
/// emitted only if the element that *declares* it lives in one of these
/// packages.
///
/// It gets the awkward cases right without naming any of them. A type
/// implementing `Stream` loses the ~60 members it inherits from `dart:async`; a
/// type extending a framework base class loses the framework's; while a helper
/// inherited from *your own* base class is kept everywhere it appears.
List<SelectedMember> selectMembers(InterfaceElement target, {required Set<String> ownedPackages}) {
  final members = <SelectedMember>[];
  final seen = <String>{};

  void consider(ExecutableElement element, MemberKind kind) {
    final name = element.name;
    if (name == null || name.isEmpty) return;
    if (element.isPrivate || element.isStatic) return;
    // A `@protected` member may only be used inside its own hierarchy, and a
    // handle is not. `pigeon` marks generated ProxyApi plumbing this way and the
    // origin rule correctly calls it owned, so without this every reference is
    // an `invalid_use_of_protected_member` — a *warning*, which the generated
    // file's `ignore_for_file: type=lint` does not silence.
    if (element.metadata.hasProtected) return;
    if (_isObjectMember(name)) return;

    final key = '${kind.name}:$name';
    if (!seen.add(key)) return;

    // A member from outside the owned packages is not reported: the origin rule
    // dropping it is the rule working, not a problem to surface.
    if (!_isOwned(element, ownedPackages)) return;

    members.add(
      SelectedMember(
        name: name,
        kind: kind,
        returnType: element.returnType,
        parameters: element.formalParameters,
        typeParameters: element.typeParameters,
      ),
    );
  }

  // Own members first, then inherited, so an override wins over the supertype
  // declaration via the `seen` guard.
  for (final element in [target, ...target.allSupertypes.map((t) => t.element)]) {
    for (final m in element.methods) {
      consider(m, MemberKind.method);
    }
    for (final g in element.getters) {
      consider(g, MemberKind.getter);
    }
    for (final s in element.setters) {
      consider(s, MemberKind.setter);
    }
  }

  members.sort((a, b) => a.name.compareTo(b.name));
  return members;
}

bool _isOwned(Element element, Set<String> ownedPackages) {
  final package = _packageOf(element);
  return package != null && ownedPackages.contains(package);
}

String? _packageOf(Element element) {
  final uri = element.library?.uri;
  if (uri == null || uri.scheme != 'package') return null;
  final segments = uri.pathSegments;
  return segments.isEmpty ? null : segments.first;
}

bool _isObjectMember(String name) => const {'toString', 'hashCode', 'runtimeType', 'noSuchMethod', '=='}.contains(name);
