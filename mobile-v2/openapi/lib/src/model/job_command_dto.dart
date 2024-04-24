//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/job_command.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_command_dto.g.dart';

/// JobCommandDto
///
/// Properties:
/// * [command] 
/// * [force] 
@BuiltValue()
abstract class JobCommandDto implements Built<JobCommandDto, JobCommandDtoBuilder> {
  @BuiltValueField(wireName: r'command')
  JobCommand get command;
  // enum commandEnum {  start,  pause,  resume,  empty,  clear-failed,  };

  @BuiltValueField(wireName: r'force')
  bool get force;

  JobCommandDto._();

  factory JobCommandDto([void updates(JobCommandDtoBuilder b)]) = _$JobCommandDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobCommandDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobCommandDto> get serializer => _$JobCommandDtoSerializer();
}

class _$JobCommandDtoSerializer implements PrimitiveSerializer<JobCommandDto> {
  @override
  final Iterable<Type> types = const [JobCommandDto, _$JobCommandDto];

  @override
  final String wireName = r'JobCommandDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobCommandDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'command';
    yield serializers.serialize(
      object.command,
      specifiedType: const FullType(JobCommand),
    );
    yield r'force';
    yield serializers.serialize(
      object.force,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobCommandDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required JobCommandDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'command':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobCommand),
          ) as JobCommand;
          result.command = valueDes;
          break;
        case r'force':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.force = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobCommandDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobCommandDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

