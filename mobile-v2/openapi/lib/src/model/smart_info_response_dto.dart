//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'smart_info_response_dto.g.dart';

/// SmartInfoResponseDto
///
/// Properties:
/// * [objects] 
/// * [tags] 
@BuiltValue()
abstract class SmartInfoResponseDto implements Built<SmartInfoResponseDto, SmartInfoResponseDtoBuilder> {
  @BuiltValueField(wireName: r'objects')
  BuiltList<String>? get objects;

  @BuiltValueField(wireName: r'tags')
  BuiltList<String>? get tags;

  SmartInfoResponseDto._();

  factory SmartInfoResponseDto([void updates(SmartInfoResponseDtoBuilder b)]) = _$SmartInfoResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SmartInfoResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SmartInfoResponseDto> get serializer => _$SmartInfoResponseDtoSerializer();
}

class _$SmartInfoResponseDtoSerializer implements PrimitiveSerializer<SmartInfoResponseDto> {
  @override
  final Iterable<Type> types = const [SmartInfoResponseDto, _$SmartInfoResponseDto];

  @override
  final String wireName = r'SmartInfoResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SmartInfoResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.objects != null) {
      yield r'objects';
      yield serializers.serialize(
        object.objects,
        specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SmartInfoResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SmartInfoResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'objects':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.objects.replace(valueDes);
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.tags.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SmartInfoResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SmartInfoResponseDtoBuilder();
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

