//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_command.g.dart';

class JobCommand extends EnumClass {

  @BuiltValueEnumConst(wireName: r'start')
  static const JobCommand start = _$start;
  @BuiltValueEnumConst(wireName: r'pause')
  static const JobCommand pause = _$pause;
  @BuiltValueEnumConst(wireName: r'resume')
  static const JobCommand resume = _$resume;
  @BuiltValueEnumConst(wireName: r'empty')
  static const JobCommand empty = _$empty;
  @BuiltValueEnumConst(wireName: r'clear-failed')
  static const JobCommand clearFailed = _$clearFailed;

  static Serializer<JobCommand> get serializer => _$jobCommandSerializer;

  const JobCommand._(String name): super(name);

  static BuiltSet<JobCommand> get values => _$values;
  static JobCommand valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class JobCommandMixin = Object with _$JobCommandMixin;

