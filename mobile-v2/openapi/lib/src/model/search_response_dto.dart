//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/search_album_response_dto.dart';
import 'package:openapi/src/model/search_asset_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_response_dto.g.dart';

/// SearchResponseDto
///
/// Properties:
/// * [albums] 
/// * [assets] 
@BuiltValue()
abstract class SearchResponseDto implements Built<SearchResponseDto, SearchResponseDtoBuilder> {
  @BuiltValueField(wireName: r'albums')
  SearchAlbumResponseDto get albums;

  @BuiltValueField(wireName: r'assets')
  SearchAssetResponseDto get assets;

  SearchResponseDto._();

  factory SearchResponseDto([void updates(SearchResponseDtoBuilder b)]) = _$SearchResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchResponseDto> get serializer => _$SearchResponseDtoSerializer();
}

class _$SearchResponseDtoSerializer implements PrimitiveSerializer<SearchResponseDto> {
  @override
  final Iterable<Type> types = const [SearchResponseDto, _$SearchResponseDto];

  @override
  final String wireName = r'SearchResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'albums';
    yield serializers.serialize(
      object.albums,
      specifiedType: const FullType(SearchAlbumResponseDto),
    );
    yield r'assets';
    yield serializers.serialize(
      object.assets,
      specifiedType: const FullType(SearchAssetResponseDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'albums':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SearchAlbumResponseDto),
          ) as SearchAlbumResponseDto;
          result.albums.replace(valueDes);
          break;
        case r'assets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SearchAssetResponseDto),
          ) as SearchAssetResponseDto;
          result.assets.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchResponseDtoBuilder();
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

