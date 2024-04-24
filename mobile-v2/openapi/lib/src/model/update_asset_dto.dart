//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_asset_dto.g.dart';

/// UpdateAssetDto
///
/// Properties:
/// * [dateTimeOriginal] 
/// * [description] 
/// * [isArchived] 
/// * [isFavorite] 
/// * [latitude] 
/// * [longitude] 
@BuiltValue()
abstract class UpdateAssetDto implements Built<UpdateAssetDto, UpdateAssetDtoBuilder> {
  @BuiltValueField(wireName: r'dateTimeOriginal')
  String? get dateTimeOriginal;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'isArchived')
  bool? get isArchived;

  @BuiltValueField(wireName: r'isFavorite')
  bool? get isFavorite;

  @BuiltValueField(wireName: r'latitude')
  num? get latitude;

  @BuiltValueField(wireName: r'longitude')
  num? get longitude;

  UpdateAssetDto._();

  factory UpdateAssetDto([void updates(UpdateAssetDtoBuilder b)]) = _$UpdateAssetDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAssetDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAssetDto> get serializer => _$UpdateAssetDtoSerializer();
}

class _$UpdateAssetDtoSerializer implements PrimitiveSerializer<UpdateAssetDto> {
  @override
  final Iterable<Type> types = const [UpdateAssetDto, _$UpdateAssetDto];

  @override
  final String wireName = r'UpdateAssetDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAssetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.dateTimeOriginal != null) {
      yield r'dateTimeOriginal';
      yield serializers.serialize(
        object.dateTimeOriginal,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.isArchived != null) {
      yield r'isArchived';
      yield serializers.serialize(
        object.isArchived,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isFavorite != null) {
      yield r'isFavorite';
      yield serializers.serialize(
        object.isFavorite,
        specifiedType: const FullType(bool),
      );
    }
    if (object.latitude != null) {
      yield r'latitude';
      yield serializers.serialize(
        object.latitude,
        specifiedType: const FullType(num),
      );
    }
    if (object.longitude != null) {
      yield r'longitude';
      yield serializers.serialize(
        object.longitude,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateAssetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateAssetDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'dateTimeOriginal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.dateTimeOriginal = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'isArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isArchived = valueDes;
          break;
        case r'isFavorite':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isFavorite = valueDes;
          break;
        case r'latitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.latitude = valueDes;
          break;
        case r'longitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.longitude = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateAssetDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAssetDtoBuilder();
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

