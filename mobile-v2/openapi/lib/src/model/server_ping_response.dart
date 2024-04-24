//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_ping_response.g.dart';

/// ServerPingResponse
///
/// Properties:
/// * [res] 
@BuiltValue()
abstract class ServerPingResponse implements Built<ServerPingResponse, ServerPingResponseBuilder> {
  @BuiltValueField(wireName: r'res')
  String get res;

  ServerPingResponse._();

  factory ServerPingResponse([void updates(ServerPingResponseBuilder b)]) = _$ServerPingResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerPingResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerPingResponse> get serializer => _$ServerPingResponseSerializer();
}

class _$ServerPingResponseSerializer implements PrimitiveSerializer<ServerPingResponse> {
  @override
  final Iterable<Type> types = const [ServerPingResponse, _$ServerPingResponse];

  @override
  final String wireName = r'ServerPingResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerPingResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'res';
    yield serializers.serialize(
      object.res,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerPingResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerPingResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'res':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.res = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerPingResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerPingResponseBuilder();
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

