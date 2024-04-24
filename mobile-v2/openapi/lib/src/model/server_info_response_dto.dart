//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_info_response_dto.g.dart';

/// ServerInfoResponseDto
///
/// Properties:
/// * [diskAvailable] 
/// * [diskAvailableRaw] 
/// * [diskSize] 
/// * [diskSizeRaw] 
/// * [diskUsagePercentage] 
/// * [diskUse] 
/// * [diskUseRaw] 
@BuiltValue()
abstract class ServerInfoResponseDto implements Built<ServerInfoResponseDto, ServerInfoResponseDtoBuilder> {
  @BuiltValueField(wireName: r'diskAvailable')
  String get diskAvailable;

  @BuiltValueField(wireName: r'diskAvailableRaw')
  int get diskAvailableRaw;

  @BuiltValueField(wireName: r'diskSize')
  String get diskSize;

  @BuiltValueField(wireName: r'diskSizeRaw')
  int get diskSizeRaw;

  @BuiltValueField(wireName: r'diskUsagePercentage')
  double get diskUsagePercentage;

  @BuiltValueField(wireName: r'diskUse')
  String get diskUse;

  @BuiltValueField(wireName: r'diskUseRaw')
  int get diskUseRaw;

  ServerInfoResponseDto._();

  factory ServerInfoResponseDto([void updates(ServerInfoResponseDtoBuilder b)]) = _$ServerInfoResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerInfoResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerInfoResponseDto> get serializer => _$ServerInfoResponseDtoSerializer();
}

class _$ServerInfoResponseDtoSerializer implements PrimitiveSerializer<ServerInfoResponseDto> {
  @override
  final Iterable<Type> types = const [ServerInfoResponseDto, _$ServerInfoResponseDto];

  @override
  final String wireName = r'ServerInfoResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerInfoResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'diskAvailable';
    yield serializers.serialize(
      object.diskAvailable,
      specifiedType: const FullType(String),
    );
    yield r'diskAvailableRaw';
    yield serializers.serialize(
      object.diskAvailableRaw,
      specifiedType: const FullType(int),
    );
    yield r'diskSize';
    yield serializers.serialize(
      object.diskSize,
      specifiedType: const FullType(String),
    );
    yield r'diskSizeRaw';
    yield serializers.serialize(
      object.diskSizeRaw,
      specifiedType: const FullType(int),
    );
    yield r'diskUsagePercentage';
    yield serializers.serialize(
      object.diskUsagePercentage,
      specifiedType: const FullType(double),
    );
    yield r'diskUse';
    yield serializers.serialize(
      object.diskUse,
      specifiedType: const FullType(String),
    );
    yield r'diskUseRaw';
    yield serializers.serialize(
      object.diskUseRaw,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerInfoResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerInfoResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'diskAvailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.diskAvailable = valueDes;
          break;
        case r'diskAvailableRaw':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.diskAvailableRaw = valueDes;
          break;
        case r'diskSize':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.diskSize = valueDes;
          break;
        case r'diskSizeRaw':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.diskSizeRaw = valueDes;
          break;
        case r'diskUsagePercentage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.diskUsagePercentage = valueDes;
          break;
        case r'diskUse':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.diskUse = valueDes;
          break;
        case r'diskUseRaw':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.diskUseRaw = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerInfoResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerInfoResponseDtoBuilder();
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

