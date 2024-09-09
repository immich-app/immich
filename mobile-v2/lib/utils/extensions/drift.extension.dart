import 'package:drift/drift.dart';

extension ExpandQuery<T> on Selectable<T> {
  /// Expands this selectable by the [expand] function.
  ///
  /// Each entry emitted by this [Selectable] will be transformed by the
  /// [expander] and then emitted to the selectable returned.
  Selectable<N> expand<N>(Iterable<N> Function(T) expander) {
    return _ExpandedSelectable<T, N>(this, expander);
  }
}

class _ExpandedSelectable<S, T> extends Selectable<T> {
  final Selectable<S> _source;
  final Iterable<T> Function(S) expander;

  _ExpandedSelectable(this._source, this.expander);

  @override
  Future<List<T>> get() {
    return _source.get().then(_mapResults);
  }

  @override
  Stream<List<T>> watch() {
    return _source.watch().map(_mapResults);
  }

  List<T> _mapResults(List<S> results) => results.expand<T>(expander).toList();
}
