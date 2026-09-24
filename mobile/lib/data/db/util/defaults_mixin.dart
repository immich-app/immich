import 'package:drift/drift.dart';

mixin DriftDefaultsMixin on Table {
  @Deprecated('Use customType(clampedDateTime)')
  @override
  ColumnBuilder<DateTime> dateTime() => super.dateTime();

  @override
  bool get isStrict => true;

  @override
  bool get withoutRowId => true;
}
