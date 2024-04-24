//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_storage_template_dto.g.dart';

/// SystemConfigStorageTemplateDto
///
/// Properties:
/// * [enabled] 
/// * [hashVerificationEnabled] 
/// * [template] 
@BuiltValue()
abstract class SystemConfigStorageTemplateDto implements Built<SystemConfigStorageTemplateDto, SystemConfigStorageTemplateDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'hashVerificationEnabled')
  bool get hashVerificationEnabled;

  @BuiltValueField(wireName: r'template')
  String get template;

  SystemConfigStorageTemplateDto._();

  factory SystemConfigStorageTemplateDto([void updates(SystemConfigStorageTemplateDtoBuilder b)]) = _$SystemConfigStorageTemplateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigStorageTemplateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigStorageTemplateDto> get serializer => _$SystemConfigStorageTemplateDtoSerializer();
}

class _$SystemConfigStorageTemplateDtoSerializer implements PrimitiveSerializer<SystemConfigStorageTemplateDto> {
  @override
  final Iterable<Type> types = const [SystemConfigStorageTemplateDto, _$SystemConfigStorageTemplateDto];

  @override
  final String wireName = r'SystemConfigStorageTemplateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigStorageTemplateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'hashVerificationEnabled';
    yield serializers.serialize(
      object.hashVerificationEnabled,
      specifiedType: const FullType(bool),
    );
    yield r'template';
    yield serializers.serialize(
      object.template,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigStorageTemplateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigStorageTemplateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        case r'hashVerificationEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hashVerificationEnabled = valueDes;
          break;
        case r'template':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.template = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigStorageTemplateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigStorageTemplateDtoBuilder();
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

