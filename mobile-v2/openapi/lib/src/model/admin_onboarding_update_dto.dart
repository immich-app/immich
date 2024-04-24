//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_onboarding_update_dto.g.dart';

/// AdminOnboardingUpdateDto
///
/// Properties:
/// * [isOnboarded] 
@BuiltValue()
abstract class AdminOnboardingUpdateDto implements Built<AdminOnboardingUpdateDto, AdminOnboardingUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'isOnboarded')
  bool get isOnboarded;

  AdminOnboardingUpdateDto._();

  factory AdminOnboardingUpdateDto([void updates(AdminOnboardingUpdateDtoBuilder b)]) = _$AdminOnboardingUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminOnboardingUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminOnboardingUpdateDto> get serializer => _$AdminOnboardingUpdateDtoSerializer();
}

class _$AdminOnboardingUpdateDtoSerializer implements PrimitiveSerializer<AdminOnboardingUpdateDto> {
  @override
  final Iterable<Type> types = const [AdminOnboardingUpdateDto, _$AdminOnboardingUpdateDto];

  @override
  final String wireName = r'AdminOnboardingUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminOnboardingUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'isOnboarded';
    yield serializers.serialize(
      object.isOnboarded,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminOnboardingUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminOnboardingUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'isOnboarded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isOnboarded = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminOnboardingUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminOnboardingUpdateDtoBuilder();
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

