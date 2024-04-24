//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_media_types_response_dto.g.dart';

/// ServerMediaTypesResponseDto
///
/// Properties:
/// * [image] 
/// * [sidecar] 
/// * [video] 
@BuiltValue()
abstract class ServerMediaTypesResponseDto implements Built<ServerMediaTypesResponseDto, ServerMediaTypesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'image')
  BuiltList<String> get image;

  @BuiltValueField(wireName: r'sidecar')
  BuiltList<String> get sidecar;

  @BuiltValueField(wireName: r'video')
  BuiltList<String> get video;

  ServerMediaTypesResponseDto._();

  factory ServerMediaTypesResponseDto([void updates(ServerMediaTypesResponseDtoBuilder b)]) = _$ServerMediaTypesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerMediaTypesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerMediaTypesResponseDto> get serializer => _$ServerMediaTypesResponseDtoSerializer();
}

class _$ServerMediaTypesResponseDtoSerializer implements PrimitiveSerializer<ServerMediaTypesResponseDto> {
  @override
  final Iterable<Type> types = const [ServerMediaTypesResponseDto, _$ServerMediaTypesResponseDto];

  @override
  final String wireName = r'ServerMediaTypesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerMediaTypesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'image';
    yield serializers.serialize(
      object.image,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'sidecar';
    yield serializers.serialize(
      object.sidecar,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'video';
    yield serializers.serialize(
      object.video,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerMediaTypesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerMediaTypesResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'image':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.image.replace(valueDes);
          break;
        case r'sidecar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.sidecar.replace(valueDes);
          break;
        case r'video':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.video.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerMediaTypesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerMediaTypesResponseDtoBuilder();
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

