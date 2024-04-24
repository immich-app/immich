//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'log_level.g.dart';

class LogLevel extends EnumClass {

  @BuiltValueEnumConst(wireName: r'verbose')
  static const LogLevel verbose = _$verbose;
  @BuiltValueEnumConst(wireName: r'debug')
  static const LogLevel debug = _$debug;
  @BuiltValueEnumConst(wireName: r'log')
  static const LogLevel log = _$log;
  @BuiltValueEnumConst(wireName: r'warn')
  static const LogLevel warn = _$warn;
  @BuiltValueEnumConst(wireName: r'error')
  static const LogLevel error = _$error;
  @BuiltValueEnumConst(wireName: r'fatal')
  static const LogLevel fatal = _$fatal;

  static Serializer<LogLevel> get serializer => _$logLevelSerializer;

  const LogLevel._(String name): super(name);

  static BuiltSet<LogLevel> get values => _$values;
  static LogLevel valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class LogLevelMixin = Object with _$LogLevelMixin;

