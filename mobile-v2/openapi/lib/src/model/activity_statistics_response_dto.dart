//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'activity_statistics_response_dto.g.dart';

/// ActivityStatisticsResponseDto
///
/// Properties:
/// * [comments] 
@BuiltValue()
abstract class ActivityStatisticsResponseDto implements Built<ActivityStatisticsResponseDto, ActivityStatisticsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'comments')
  int get comments;

  ActivityStatisticsResponseDto._();

  factory ActivityStatisticsResponseDto([void updates(ActivityStatisticsResponseDtoBuilder b)]) = _$ActivityStatisticsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ActivityStatisticsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ActivityStatisticsResponseDto> get serializer => _$ActivityStatisticsResponseDtoSerializer();
}

class _$ActivityStatisticsResponseDtoSerializer implements PrimitiveSerializer<ActivityStatisticsResponseDto> {
  @override
  final Iterable<Type> types = const [ActivityStatisticsResponseDto, _$ActivityStatisticsResponseDto];

  @override
  final String wireName = r'ActivityStatisticsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ActivityStatisticsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'comments';
    yield serializers.serialize(
      object.comments,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ActivityStatisticsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ActivityStatisticsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'comments':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.comments = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ActivityStatisticsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ActivityStatisticsResponseDtoBuilder();
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

