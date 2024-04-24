//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_partner_dto.g.dart';

/// UpdatePartnerDto
///
/// Properties:
/// * [inTimeline] 
@BuiltValue()
abstract class UpdatePartnerDto implements Built<UpdatePartnerDto, UpdatePartnerDtoBuilder> {
  @BuiltValueField(wireName: r'inTimeline')
  bool get inTimeline;

  UpdatePartnerDto._();

  factory UpdatePartnerDto([void updates(UpdatePartnerDtoBuilder b)]) = _$UpdatePartnerDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdatePartnerDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdatePartnerDto> get serializer => _$UpdatePartnerDtoSerializer();
}

class _$UpdatePartnerDtoSerializer implements PrimitiveSerializer<UpdatePartnerDto> {
  @override
  final Iterable<Type> types = const [UpdatePartnerDto, _$UpdatePartnerDto];

  @override
  final String wireName = r'UpdatePartnerDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePartnerDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'inTimeline';
    yield serializers.serialize(
      object.inTimeline,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePartnerDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdatePartnerDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'inTimeline':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.inTimeline = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdatePartnerDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdatePartnerDtoBuilder();
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

