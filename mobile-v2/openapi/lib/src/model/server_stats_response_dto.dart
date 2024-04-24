//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/usage_by_user_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_stats_response_dto.g.dart';

/// ServerStatsResponseDto
///
/// Properties:
/// * [photos] 
/// * [usage] 
/// * [usageByUser] 
/// * [videos] 
@BuiltValue()
abstract class ServerStatsResponseDto implements Built<ServerStatsResponseDto, ServerStatsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'photos')
  int get photos;

  @BuiltValueField(wireName: r'usage')
  int get usage;

  @BuiltValueField(wireName: r'usageByUser')
  BuiltList<UsageByUserDto> get usageByUser;

  @BuiltValueField(wireName: r'videos')
  int get videos;

  ServerStatsResponseDto._();

  factory ServerStatsResponseDto([void updates(ServerStatsResponseDtoBuilder b)]) = _$ServerStatsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerStatsResponseDtoBuilder b) => b
      ..photos = 0
      ..usage = 0
      ..usageByUser = ListBuilder()
      ..videos = 0;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerStatsResponseDto> get serializer => _$ServerStatsResponseDtoSerializer();
}

class _$ServerStatsResponseDtoSerializer implements PrimitiveSerializer<ServerStatsResponseDto> {
  @override
  final Iterable<Type> types = const [ServerStatsResponseDto, _$ServerStatsResponseDto];

  @override
  final String wireName = r'ServerStatsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'photos';
    yield serializers.serialize(
      object.photos,
      specifiedType: const FullType(int),
    );
    yield r'usage';
    yield serializers.serialize(
      object.usage,
      specifiedType: const FullType(int),
    );
    yield r'usageByUser';
    yield serializers.serialize(
      object.usageByUser,
      specifiedType: const FullType(BuiltList, [FullType(UsageByUserDto)]),
    );
    yield r'videos';
    yield serializers.serialize(
      object.videos,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerStatsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'photos':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.photos = valueDes;
          break;
        case r'usage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.usage = valueDes;
          break;
        case r'usageByUser':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(UsageByUserDto)]),
          ) as BuiltList<UsageByUserDto>;
          result.usageByUser.replace(valueDes);
          break;
        case r'videos':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.videos = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerStatsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerStatsResponseDtoBuilder();
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

