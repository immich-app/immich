//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_counts_dto.g.dart';

/// JobCountsDto
///
/// Properties:
/// * [active] 
/// * [completed] 
/// * [delayed] 
/// * [failed] 
/// * [paused] 
/// * [waiting] 
@BuiltValue()
abstract class JobCountsDto implements Built<JobCountsDto, JobCountsDtoBuilder> {
  @BuiltValueField(wireName: r'active')
  int get active;

  @BuiltValueField(wireName: r'completed')
  int get completed;

  @BuiltValueField(wireName: r'delayed')
  int get delayed;

  @BuiltValueField(wireName: r'failed')
  int get failed;

  @BuiltValueField(wireName: r'paused')
  int get paused;

  @BuiltValueField(wireName: r'waiting')
  int get waiting;

  JobCountsDto._();

  factory JobCountsDto([void updates(JobCountsDtoBuilder b)]) = _$JobCountsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobCountsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobCountsDto> get serializer => _$JobCountsDtoSerializer();
}

class _$JobCountsDtoSerializer implements PrimitiveSerializer<JobCountsDto> {
  @override
  final Iterable<Type> types = const [JobCountsDto, _$JobCountsDto];

  @override
  final String wireName = r'JobCountsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobCountsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'active';
    yield serializers.serialize(
      object.active,
      specifiedType: const FullType(int),
    );
    yield r'completed';
    yield serializers.serialize(
      object.completed,
      specifiedType: const FullType(int),
    );
    yield r'delayed';
    yield serializers.serialize(
      object.delayed,
      specifiedType: const FullType(int),
    );
    yield r'failed';
    yield serializers.serialize(
      object.failed,
      specifiedType: const FullType(int),
    );
    yield r'paused';
    yield serializers.serialize(
      object.paused,
      specifiedType: const FullType(int),
    );
    yield r'waiting';
    yield serializers.serialize(
      object.waiting,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobCountsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required JobCountsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'active':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.active = valueDes;
          break;
        case r'completed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.completed = valueDes;
          break;
        case r'delayed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.delayed = valueDes;
          break;
        case r'failed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.failed = valueDes;
          break;
        case r'paused':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.paused = valueDes;
          break;
        case r'waiting':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.waiting = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobCountsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobCountsDtoBuilder();
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

