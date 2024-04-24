//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'person_statistics_response_dto.g.dart';

/// PersonStatisticsResponseDto
///
/// Properties:
/// * [assets] 
@BuiltValue()
abstract class PersonStatisticsResponseDto implements Built<PersonStatisticsResponseDto, PersonStatisticsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'assets')
  int get assets;

  PersonStatisticsResponseDto._();

  factory PersonStatisticsResponseDto([void updates(PersonStatisticsResponseDtoBuilder b)]) = _$PersonStatisticsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PersonStatisticsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PersonStatisticsResponseDto> get serializer => _$PersonStatisticsResponseDtoSerializer();
}

class _$PersonStatisticsResponseDtoSerializer implements PrimitiveSerializer<PersonStatisticsResponseDto> {
  @override
  final Iterable<Type> types = const [PersonStatisticsResponseDto, _$PersonStatisticsResponseDto];

  @override
  final String wireName = r'PersonStatisticsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PersonStatisticsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assets';
    yield serializers.serialize(
      object.assets,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PersonStatisticsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PersonStatisticsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.assets = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PersonStatisticsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PersonStatisticsResponseDtoBuilder();
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

