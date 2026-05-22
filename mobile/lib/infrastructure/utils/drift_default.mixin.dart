import 'package:drift/drift.dart';

mixin DriftDefaultsMixin on Table {
  @override
  bool get isStrict => true;

  @override
  bool get withoutRowId => true;
}
