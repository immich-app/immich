//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_features_dto.g.dart';

/// ServerFeaturesDto
///
/// Properties:
/// * [configFile] 
/// * [facialRecognition] 
/// * [map] 
/// * [oauth] 
/// * [oauthAutoLaunch] 
/// * [passwordLogin] 
/// * [reverseGeocoding] 
/// * [search] 
/// * [sidecar] 
/// * [smartSearch] 
/// * [trash] 
@BuiltValue()
abstract class ServerFeaturesDto implements Built<ServerFeaturesDto, ServerFeaturesDtoBuilder> {
  @BuiltValueField(wireName: r'configFile')
  bool get configFile;

  @BuiltValueField(wireName: r'facialRecognition')
  bool get facialRecognition;

  @BuiltValueField(wireName: r'map')
  bool get map;

  @BuiltValueField(wireName: r'oauth')
  bool get oauth;

  @BuiltValueField(wireName: r'oauthAutoLaunch')
  bool get oauthAutoLaunch;

  @BuiltValueField(wireName: r'passwordLogin')
  bool get passwordLogin;

  @BuiltValueField(wireName: r'reverseGeocoding')
  bool get reverseGeocoding;

  @BuiltValueField(wireName: r'search')
  bool get search;

  @BuiltValueField(wireName: r'sidecar')
  bool get sidecar;

  @BuiltValueField(wireName: r'smartSearch')
  bool get smartSearch;

  @BuiltValueField(wireName: r'trash')
  bool get trash;

  ServerFeaturesDto._();

  factory ServerFeaturesDto([void updates(ServerFeaturesDtoBuilder b)]) = _$ServerFeaturesDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerFeaturesDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerFeaturesDto> get serializer => _$ServerFeaturesDtoSerializer();
}

class _$ServerFeaturesDtoSerializer implements PrimitiveSerializer<ServerFeaturesDto> {
  @override
  final Iterable<Type> types = const [ServerFeaturesDto, _$ServerFeaturesDto];

  @override
  final String wireName = r'ServerFeaturesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerFeaturesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'configFile';
    yield serializers.serialize(
      object.configFile,
      specifiedType: const FullType(bool),
    );
    yield r'facialRecognition';
    yield serializers.serialize(
      object.facialRecognition,
      specifiedType: const FullType(bool),
    );
    yield r'map';
    yield serializers.serialize(
      object.map,
      specifiedType: const FullType(bool),
    );
    yield r'oauth';
    yield serializers.serialize(
      object.oauth,
      specifiedType: const FullType(bool),
    );
    yield r'oauthAutoLaunch';
    yield serializers.serialize(
      object.oauthAutoLaunch,
      specifiedType: const FullType(bool),
    );
    yield r'passwordLogin';
    yield serializers.serialize(
      object.passwordLogin,
      specifiedType: const FullType(bool),
    );
    yield r'reverseGeocoding';
    yield serializers.serialize(
      object.reverseGeocoding,
      specifiedType: const FullType(bool),
    );
    yield r'search';
    yield serializers.serialize(
      object.search,
      specifiedType: const FullType(bool),
    );
    yield r'sidecar';
    yield serializers.serialize(
      object.sidecar,
      specifiedType: const FullType(bool),
    );
    yield r'smartSearch';
    yield serializers.serialize(
      object.smartSearch,
      specifiedType: const FullType(bool),
    );
    yield r'trash';
    yield serializers.serialize(
      object.trash,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerFeaturesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerFeaturesDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'configFile':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.configFile = valueDes;
          break;
        case r'facialRecognition':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.facialRecognition = valueDes;
          break;
        case r'map':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.map = valueDes;
          break;
        case r'oauth':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.oauth = valueDes;
          break;
        case r'oauthAutoLaunch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.oauthAutoLaunch = valueDes;
          break;
        case r'passwordLogin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.passwordLogin = valueDes;
          break;
        case r'reverseGeocoding':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.reverseGeocoding = valueDes;
          break;
        case r'search':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.search = valueDes;
          break;
        case r'sidecar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.sidecar = valueDes;
          break;
        case r'smartSearch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.smartSearch = valueDes;
          break;
        case r'trash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.trash = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerFeaturesDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerFeaturesDtoBuilder();
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

