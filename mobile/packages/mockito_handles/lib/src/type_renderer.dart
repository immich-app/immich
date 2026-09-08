import 'package:analyzer/dart/element/element.dart';
import 'package:analyzer/dart/element/nullability_suffix.dart';
import 'package:analyzer/dart/element/type.dart';

/// Thrown when a type cannot be written into generated source.
///
/// Caught per member by the emitter, so one exotic signature costs that member
/// its handle rather than failing a build the whole test suite depends on.
class UnrenderableType implements Exception {
  UnrenderableType(this.reason);

  final String reason;

  @override
  String toString() => 'UnrenderableType: $reason';
}

/// Renders [DartType]s as source, allocating a unique prefix per library.
///
/// Every import is prefixed (`p0`, `p1`, …) rather than only the ambiguous ones.
/// A generated file pulls in every library any mocked signature mentions, where
/// simple names collide often — two different `Direction` enums, an `Option`
/// from two packages — so prefixing everything makes a collision impossible by
/// construction instead of something to detect.
class TypeRenderer {
  final Map<String, String> _prefixByUri = {};

  /// Type parameters in scope at the current emission point.
  ///
  /// Only a function type brings any: the emitter skips generic members
  /// outright, so a bare `T` reaching [render] outside a `Function<T>(...)` is a
  /// type parameter that cannot be named at the emission point, which is an
  /// [UnrenderableType] rather than a silently wrong render.
  final Set<TypeParameterElement> _inScope = {};

  /// Every import the rendered types need, as `uri` to prefix.
  ///
  /// A Dart `Map` iterates in insertion order and prefixes are handed out in
  /// that same order, so this is already `p0, p1, p2, …` and needs no sort. A
  /// sort would in fact *unsort* it, ordering `p10` before `p2`.
  Iterable<MapEntry<String, String>> get imports => _prefixByUri.entries;

  String _prefixFor(Uri uri) => _prefixByUri.putIfAbsent(uri.toString(), () => 'p${_prefixByUri.length}');

  void _pushScope(Iterable<TypeParameterElement> params) => _inScope.addAll(params);

  void _popScope(Iterable<TypeParameterElement> params) => _inScope.removeAll(params);

  /// Renders a bare reference to [element], dropping any type arguments.
  ///
  /// Used for a parameter's default value, which names the type but never its
  /// arguments: `const Option.none()` is written the same whether the parameter
  /// is `Option<String>` or `Option<int>`.
  String renderElement(InterfaceElement element) {
    final name = element.name;
    if (name == null) throw UnrenderableType('unnamed element');
    final uri = element.library.uri;
    if (uri.scheme == 'dart' && uri.path == 'core') return name;
    return '${_prefixFor(uri)}.$name';
  }

  String render(DartType type) {
    final buffer = StringBuffer();
    _write(type, buffer);
    return buffer.toString();
  }

  void _write(DartType type, StringBuffer out) {
    final suffix = type.nullabilitySuffix == NullabilitySuffix.question ? '?' : '';

    switch (type) {
      case DynamicType():
        out.write('dynamic');
        return;
      case VoidType():
        out.write('void');
        return;
      case NeverType():
        out.write('Never$suffix');
        return;
      case TypeParameterType():
        final element = type.element;
        if (!_inScope.contains(element)) {
          throw UnrenderableType('type parameter ${element.name} is not in scope');
        }
        out.write('${element.name}$suffix');
        return;
      case RecordType():
        _writeRecord(type, out, suffix);
        return;
      case FunctionType():
        _writeFunction(type, out, suffix);
        return;
      case InterfaceType():
        _writeInterface(type, out, suffix);
        return;
      default:
        throw UnrenderableType('unsupported type ${type.runtimeType}: ${type.getDisplayString()}');
    }
  }

  void _writeInterface(InterfaceType type, StringBuffer out, String suffix) {
    final element = type.element;
    final name = element.name;
    if (name == null) throw UnrenderableType('unnamed interface type');

    final uri = element.library.uri;
    if (uri.scheme == 'dart' && uri.path == 'core') {
      out.write(name);
    } else {
      out.write('${_prefixFor(uri)}.$name');
    }

    if (type.typeArguments.isNotEmpty) {
      out.write('<');
      for (var i = 0; i < type.typeArguments.length; i++) {
        if (i > 0) out.write(', ');
        _write(type.typeArguments[i], out);
      }
      out.write('>');
    }
    out.write(suffix);
  }

  void _writeRecord(RecordType type, StringBuffer out, String suffix) {
    out.write('(');
    var wrote = false;
    for (final field in type.positionalFields) {
      if (wrote) out.write(', ');
      _write(field.type, out);
      wrote = true;
    }
    if (type.namedFields.isNotEmpty) {
      if (wrote) out.write(', ');
      out.write('{');
      for (var i = 0; i < type.namedFields.length; i++) {
        if (i > 0) out.write(', ');
        final field = type.namedFields[i];
        _write(field.type, out);
        out.write(' ${field.name}');
      }
      out.write('}');
    } else if (type.positionalFields.length == 1) {
      // A single-element positional record needs a trailing comma: `(int,)`.
      out.write(',');
    }
    out.write(')$suffix');
  }

  void _writeFunction(FunctionType type, StringBuffer out, String suffix) {
    final generics = type.typeParameters;
    if (generics.isNotEmpty) _pushScope(generics);
    // A type nested inside this one may be unrenderable, and the throw must not
    // leave this function's type parameters in scope for whatever is rendered
    // next — they would resolve to names the output never declares.
    try {
      _write(type.returnType, out);
      out.write(' Function');
      if (generics.isNotEmpty) out.write('<${generics.map((t) => t.name).join(', ')}>');

      // Dart does not allow optional positional and named parameters together,
      // so at most one of these two groups is ever non-empty.
      final positional = type.formalParameters.where((p) => !p.isNamed).toList();
      final named = type.formalParameters.where((p) => p.isNamed).toList();
      final optionalFrom = positional.indexWhere((p) => p.isOptionalPositional);

      out.write('(');
      for (final (i, p) in positional.indexed) {
        if (i > 0) out.write(', ');
        if (i == optionalFrom) out.write('[');
        _write(p.type, out);
      }
      if (optionalFrom >= 0) out.write(']');

      if (named.isNotEmpty) {
        if (positional.isNotEmpty) out.write(', ');
        final parts = named.map((p) => '${p.isRequiredNamed ? 'required ' : ''}${render(p.type)} ${p.name}');
        out.write('{${parts.join(', ')}}');
      }
      out.write(')$suffix');
    } finally {
      if (generics.isNotEmpty) _popScope(generics);
    }
  }
}
