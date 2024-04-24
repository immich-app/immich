//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_o_auth_dto.g.dart';

/// SystemConfigOAuthDto
///
/// Properties:
/// * [autoLaunch] 
/// * [autoRegister] 
/// * [buttonText] 
/// * [clientId] 
/// * [clientSecret] 
/// * [defaultStorageQuota] 
/// * [enabled] 
/// * [issuerUrl] 
/// * [mobileOverrideEnabled] 
/// * [mobileRedirectUri] 
/// * [scope] 
/// * [signingAlgorithm] 
/// * [storageLabelClaim] 
/// * [storageQuotaClaim] 
@BuiltValue()
abstract class SystemConfigOAuthDto implements Built<SystemConfigOAuthDto, SystemConfigOAuthDtoBuilder> {
  @BuiltValueField(wireName: r'autoLaunch')
  bool get autoLaunch;

  @BuiltValueField(wireName: r'autoRegister')
  bool get autoRegister;

  @BuiltValueField(wireName: r'buttonText')
  String get buttonText;

  @BuiltValueField(wireName: r'clientId')
  String get clientId;

  @BuiltValueField(wireName: r'clientSecret')
  String get clientSecret;

  @BuiltValueField(wireName: r'defaultStorageQuota')
  num get defaultStorageQuota;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'issuerUrl')
  String get issuerUrl;

  @BuiltValueField(wireName: r'mobileOverrideEnabled')
  bool get mobileOverrideEnabled;

  @BuiltValueField(wireName: r'mobileRedirectUri')
  String get mobileRedirectUri;

  @BuiltValueField(wireName: r'scope')
  String get scope;

  @BuiltValueField(wireName: r'signingAlgorithm')
  String get signingAlgorithm;

  @BuiltValueField(wireName: r'storageLabelClaim')
  String get storageLabelClaim;

  @BuiltValueField(wireName: r'storageQuotaClaim')
  String get storageQuotaClaim;

  SystemConfigOAuthDto._();

  factory SystemConfigOAuthDto([void updates(SystemConfigOAuthDtoBuilder b)]) = _$SystemConfigOAuthDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigOAuthDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigOAuthDto> get serializer => _$SystemConfigOAuthDtoSerializer();
}

class _$SystemConfigOAuthDtoSerializer implements PrimitiveSerializer<SystemConfigOAuthDto> {
  @override
  final Iterable<Type> types = const [SystemConfigOAuthDto, _$SystemConfigOAuthDto];

  @override
  final String wireName = r'SystemConfigOAuthDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigOAuthDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'autoLaunch';
    yield serializers.serialize(
      object.autoLaunch,
      specifiedType: const FullType(bool),
    );
    yield r'autoRegister';
    yield serializers.serialize(
      object.autoRegister,
      specifiedType: const FullType(bool),
    );
    yield r'buttonText';
    yield serializers.serialize(
      object.buttonText,
      specifiedType: const FullType(String),
    );
    yield r'clientId';
    yield serializers.serialize(
      object.clientId,
      specifiedType: const FullType(String),
    );
    yield r'clientSecret';
    yield serializers.serialize(
      object.clientSecret,
      specifiedType: const FullType(String),
    );
    yield r'defaultStorageQuota';
    yield serializers.serialize(
      object.defaultStorageQuota,
      specifiedType: const FullType(num),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'issuerUrl';
    yield serializers.serialize(
      object.issuerUrl,
      specifiedType: const FullType(String),
    );
    yield r'mobileOverrideEnabled';
    yield serializers.serialize(
      object.mobileOverrideEnabled,
      specifiedType: const FullType(bool),
    );
    yield r'mobileRedirectUri';
    yield serializers.serialize(
      object.mobileRedirectUri,
      specifiedType: const FullType(String),
    );
    yield r'scope';
    yield serializers.serialize(
      object.scope,
      specifiedType: const FullType(String),
    );
    yield r'signingAlgorithm';
    yield serializers.serialize(
      object.signingAlgorithm,
      specifiedType: const FullType(String),
    );
    yield r'storageLabelClaim';
    yield serializers.serialize(
      object.storageLabelClaim,
      specifiedType: const FullType(String),
    );
    yield r'storageQuotaClaim';
    yield serializers.serialize(
      object.storageQuotaClaim,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigOAuthDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigOAuthDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'autoLaunch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.autoLaunch = valueDes;
          break;
        case r'autoRegister':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.autoRegister = valueDes;
          break;
        case r'buttonText':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.buttonText = valueDes;
          break;
        case r'clientId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientId = valueDes;
          break;
        case r'clientSecret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientSecret = valueDes;
          break;
        case r'defaultStorageQuota':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.defaultStorageQuota = valueDes;
          break;
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        case r'issuerUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.issuerUrl = valueDes;
          break;
        case r'mobileOverrideEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.mobileOverrideEnabled = valueDes;
          break;
        case r'mobileRedirectUri':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mobileRedirectUri = valueDes;
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scope = valueDes;
          break;
        case r'signingAlgorithm':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.signingAlgorithm = valueDes;
          break;
        case r'storageLabelClaim':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.storageLabelClaim = valueDes;
          break;
        case r'storageQuotaClaim':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.storageQuotaClaim = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigOAuthDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigOAuthDtoBuilder();
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

