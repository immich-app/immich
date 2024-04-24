//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/queue_status_dto.dart';
import 'package:openapi/src/model/job_counts_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_status_dto.g.dart';

/// JobStatusDto
///
/// Properties:
/// * [jobCounts] 
/// * [queueStatus] 
@BuiltValue()
abstract class JobStatusDto implements Built<JobStatusDto, JobStatusDtoBuilder> {
  @BuiltValueField(wireName: r'jobCounts')
  JobCountsDto get jobCounts;

  @BuiltValueField(wireName: r'queueStatus')
  QueueStatusDto get queueStatus;

  JobStatusDto._();

  factory JobStatusDto([void updates(JobStatusDtoBuilder b)]) = _$JobStatusDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobStatusDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobStatusDto> get serializer => _$JobStatusDtoSerializer();
}

class _$JobStatusDtoSerializer implements PrimitiveSerializer<JobStatusDto> {
  @override
  final Iterable<Type> types = const [JobStatusDto, _$JobStatusDto];

  @override
  final String wireName = r'JobStatusDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'jobCounts';
    yield serializers.serialize(
      object.jobCounts,
      specifiedType: const FullType(JobCountsDto),
    );
    yield r'queueStatus';
    yield serializers.serialize(
      object.queueStatus,
      specifiedType: const FullType(QueueStatusDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required JobStatusDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'jobCounts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobCountsDto),
          ) as JobCountsDto;
          result.jobCounts.replace(valueDes);
          break;
        case r'queueStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(QueueStatusDto),
          ) as QueueStatusDto;
          result.queueStatus.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobStatusDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobStatusDtoBuilder();
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

