//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'on_this_day_dto.g.dart';

/// OnThisDayDto
///
/// Properties:
/// * [year] 
@BuiltValue()
abstract class OnThisDayDto implements Built<OnThisDayDto, OnThisDayDtoBuilder> {
  @BuiltValueField(wireName: r'year')
  num get year;

  OnThisDayDto._();

  factory OnThisDayDto([void updates(OnThisDayDtoBuilder b)]) = _$OnThisDayDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OnThisDayDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OnThisDayDto> get serializer => _$OnThisDayDtoSerializer();
}

class _$OnThisDayDtoSerializer implements PrimitiveSerializer<OnThisDayDto> {
  @override
  final Iterable<Type> types = const [OnThisDayDto, _$OnThisDayDto];

  @override
  final String wireName = r'OnThisDayDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OnThisDayDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'year';
    yield serializers.serialize(
      object.year,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OnThisDayDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required OnThisDayDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'year':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.year = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OnThisDayDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OnThisDayDtoBuilder();
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

