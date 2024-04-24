//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reverse_geocoding_state_response_dto.g.dart';

/// ReverseGeocodingStateResponseDto
///
/// Properties:
/// * [lastImportFileName] 
/// * [lastUpdate] 
@BuiltValue()
abstract class ReverseGeocodingStateResponseDto implements Built<ReverseGeocodingStateResponseDto, ReverseGeocodingStateResponseDtoBuilder> {
  @BuiltValueField(wireName: r'lastImportFileName')
  String? get lastImportFileName;

  @BuiltValueField(wireName: r'lastUpdate')
  String? get lastUpdate;

  ReverseGeocodingStateResponseDto._();

  factory ReverseGeocodingStateResponseDto([void updates(ReverseGeocodingStateResponseDtoBuilder b)]) = _$ReverseGeocodingStateResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReverseGeocodingStateResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReverseGeocodingStateResponseDto> get serializer => _$ReverseGeocodingStateResponseDtoSerializer();
}

class _$ReverseGeocodingStateResponseDtoSerializer implements PrimitiveSerializer<ReverseGeocodingStateResponseDto> {
  @override
  final Iterable<Type> types = const [ReverseGeocodingStateResponseDto, _$ReverseGeocodingStateResponseDto];

  @override
  final String wireName = r'ReverseGeocodingStateResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReverseGeocodingStateResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lastImportFileName';
    yield object.lastImportFileName == null ? null : serializers.serialize(
      object.lastImportFileName,
      specifiedType: const FullType.nullable(String),
    );
    yield r'lastUpdate';
    yield object.lastUpdate == null ? null : serializers.serialize(
      object.lastUpdate,
      specifiedType: const FullType.nullable(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReverseGeocodingStateResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReverseGeocodingStateResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'lastImportFileName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.lastImportFileName = valueDes;
          break;
        case r'lastUpdate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.lastUpdate = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReverseGeocodingStateResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReverseGeocodingStateResponseDtoBuilder();
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

