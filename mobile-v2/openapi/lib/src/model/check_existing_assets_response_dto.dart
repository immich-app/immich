//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'check_existing_assets_response_dto.g.dart';

/// CheckExistingAssetsResponseDto
///
/// Properties:
/// * [existingIds] 
@BuiltValue()
abstract class CheckExistingAssetsResponseDto implements Built<CheckExistingAssetsResponseDto, CheckExistingAssetsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'existingIds')
  BuiltList<String> get existingIds;

  CheckExistingAssetsResponseDto._();

  factory CheckExistingAssetsResponseDto([void updates(CheckExistingAssetsResponseDtoBuilder b)]) = _$CheckExistingAssetsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CheckExistingAssetsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CheckExistingAssetsResponseDto> get serializer => _$CheckExistingAssetsResponseDtoSerializer();
}

class _$CheckExistingAssetsResponseDtoSerializer implements PrimitiveSerializer<CheckExistingAssetsResponseDto> {
  @override
  final Iterable<Type> types = const [CheckExistingAssetsResponseDto, _$CheckExistingAssetsResponseDto];

  @override
  final String wireName = r'CheckExistingAssetsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CheckExistingAssetsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'existingIds';
    yield serializers.serialize(
      object.existingIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CheckExistingAssetsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CheckExistingAssetsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'existingIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.existingIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CheckExistingAssetsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CheckExistingAssetsResponseDtoBuilder();
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

