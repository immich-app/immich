//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_config_dto.g.dart';

/// ServerConfigDto
///
/// Properties:
/// * [externalDomain] 
/// * [isInitialized] 
/// * [isOnboarded] 
/// * [loginPageMessage] 
/// * [oauthButtonText] 
/// * [trashDays] 
/// * [userDeleteDelay] 
@BuiltValue()
abstract class ServerConfigDto implements Built<ServerConfigDto, ServerConfigDtoBuilder> {
  @BuiltValueField(wireName: r'externalDomain')
  String get externalDomain;

  @BuiltValueField(wireName: r'isInitialized')
  bool get isInitialized;

  @BuiltValueField(wireName: r'isOnboarded')
  bool get isOnboarded;

  @BuiltValueField(wireName: r'loginPageMessage')
  String get loginPageMessage;

  @BuiltValueField(wireName: r'oauthButtonText')
  String get oauthButtonText;

  @BuiltValueField(wireName: r'trashDays')
  int get trashDays;

  @BuiltValueField(wireName: r'userDeleteDelay')
  int get userDeleteDelay;

  ServerConfigDto._();

  factory ServerConfigDto([void updates(ServerConfigDtoBuilder b)]) = _$ServerConfigDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerConfigDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerConfigDto> get serializer => _$ServerConfigDtoSerializer();
}

class _$ServerConfigDtoSerializer implements PrimitiveSerializer<ServerConfigDto> {
  @override
  final Iterable<Type> types = const [ServerConfigDto, _$ServerConfigDto];

  @override
  final String wireName = r'ServerConfigDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'externalDomain';
    yield serializers.serialize(
      object.externalDomain,
      specifiedType: const FullType(String),
    );
    yield r'isInitialized';
    yield serializers.serialize(
      object.isInitialized,
      specifiedType: const FullType(bool),
    );
    yield r'isOnboarded';
    yield serializers.serialize(
      object.isOnboarded,
      specifiedType: const FullType(bool),
    );
    yield r'loginPageMessage';
    yield serializers.serialize(
      object.loginPageMessage,
      specifiedType: const FullType(String),
    );
    yield r'oauthButtonText';
    yield serializers.serialize(
      object.oauthButtonText,
      specifiedType: const FullType(String),
    );
    yield r'trashDays';
    yield serializers.serialize(
      object.trashDays,
      specifiedType: const FullType(int),
    );
    yield r'userDeleteDelay';
    yield serializers.serialize(
      object.userDeleteDelay,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerConfigDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'externalDomain':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.externalDomain = valueDes;
          break;
        case r'isInitialized':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isInitialized = valueDes;
          break;
        case r'isOnboarded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isOnboarded = valueDes;
          break;
        case r'loginPageMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.loginPageMessage = valueDes;
          break;
        case r'oauthButtonText':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.oauthButtonText = valueDes;
          break;
        case r'trashDays':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.trashDays = valueDes;
          break;
        case r'userDeleteDelay':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.userDeleteDelay = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerConfigDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerConfigDtoBuilder();
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

