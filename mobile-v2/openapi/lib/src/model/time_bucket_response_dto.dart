//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'time_bucket_response_dto.g.dart';

/// TimeBucketResponseDto
///
/// Properties:
/// * [count] 
/// * [timeBucket] 
@BuiltValue()
abstract class TimeBucketResponseDto implements Built<TimeBucketResponseDto, TimeBucketResponseDtoBuilder> {
  @BuiltValueField(wireName: r'count')
  int get count;

  @BuiltValueField(wireName: r'timeBucket')
  String get timeBucket;

  TimeBucketResponseDto._();

  factory TimeBucketResponseDto([void updates(TimeBucketResponseDtoBuilder b)]) = _$TimeBucketResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TimeBucketResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TimeBucketResponseDto> get serializer => _$TimeBucketResponseDtoSerializer();
}

class _$TimeBucketResponseDtoSerializer implements PrimitiveSerializer<TimeBucketResponseDto> {
  @override
  final Iterable<Type> types = const [TimeBucketResponseDto, _$TimeBucketResponseDto];

  @override
  final String wireName = r'TimeBucketResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TimeBucketResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(int),
    );
    yield r'timeBucket';
    yield serializers.serialize(
      object.timeBucket,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TimeBucketResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TimeBucketResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.count = valueDes;
          break;
        case r'timeBucket':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.timeBucket = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TimeBucketResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TimeBucketResponseDtoBuilder();
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

