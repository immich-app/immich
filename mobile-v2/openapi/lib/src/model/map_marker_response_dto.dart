//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'map_marker_response_dto.g.dart';

/// MapMarkerResponseDto
///
/// Properties:
/// * [city] 
/// * [country] 
/// * [id] 
/// * [lat] 
/// * [lon] 
/// * [state] 
@BuiltValue()
abstract class MapMarkerResponseDto implements Built<MapMarkerResponseDto, MapMarkerResponseDtoBuilder> {
  @BuiltValueField(wireName: r'city')
  String? get city;

  @BuiltValueField(wireName: r'country')
  String? get country;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'lat')
  double get lat;

  @BuiltValueField(wireName: r'lon')
  double get lon;

  @BuiltValueField(wireName: r'state')
  String? get state;

  MapMarkerResponseDto._();

  factory MapMarkerResponseDto([void updates(MapMarkerResponseDtoBuilder b)]) = _$MapMarkerResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MapMarkerResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MapMarkerResponseDto> get serializer => _$MapMarkerResponseDtoSerializer();
}

class _$MapMarkerResponseDtoSerializer implements PrimitiveSerializer<MapMarkerResponseDto> {
  @override
  final Iterable<Type> types = const [MapMarkerResponseDto, _$MapMarkerResponseDto];

  @override
  final String wireName = r'MapMarkerResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MapMarkerResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'city';
    yield object.city == null ? null : serializers.serialize(
      object.city,
      specifiedType: const FullType.nullable(String),
    );
    yield r'country';
    yield object.country == null ? null : serializers.serialize(
      object.country,
      specifiedType: const FullType.nullable(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lat';
    yield serializers.serialize(
      object.lat,
      specifiedType: const FullType(double),
    );
    yield r'lon';
    yield serializers.serialize(
      object.lon,
      specifiedType: const FullType(double),
    );
    yield r'state';
    yield object.state == null ? null : serializers.serialize(
      object.state,
      specifiedType: const FullType.nullable(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MapMarkerResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MapMarkerResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'city':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.city = valueDes;
          break;
        case r'country':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.country = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'lat':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.lat = valueDes;
          break;
        case r'lon':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.lon = valueDes;
          break;
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.state = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MapMarkerResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MapMarkerResponseDtoBuilder();
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

