import 'dart:math';

import 'package:drift/drift.dart';
// ignore: invalid_use_of_internal_member, implementation_imports
import 'package:drift/src/runtime/query_builder/expressions/internal.dart';

extension DoubleTruncateExpression<T extends num> on Expression<T> {
  Expression<T> truncateTo(int fractionDigits) {
    final mod = Constant(pow(10, fractionDigits).toDouble());
    return BaseInfixOperator(
      BaseInfixOperator(this, '*', mod, precedence: Precedence.mulDivide).cast(DriftSqlType.int),
      '/',
      mod,
      precedence: Precedence.mulDivide,
    );
  }
}
