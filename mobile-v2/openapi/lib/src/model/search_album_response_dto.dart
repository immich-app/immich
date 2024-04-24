//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/search_facet_response_dto.dart';
import 'package:openapi/src/model/album_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_album_response_dto.g.dart';

/// SearchAlbumResponseDto
///
/// Properties:
/// * [count] 
/// * [facets] 
/// * [items] 
/// * [total] 
@BuiltValue()
abstract class SearchAlbumResponseDto implements Built<SearchAlbumResponseDto, SearchAlbumResponseDtoBuilder> {
  @BuiltValueField(wireName: r'count')
  int get count;

  @BuiltValueField(wireName: r'facets')
  BuiltList<SearchFacetResponseDto> get facets;

  @BuiltValueField(wireName: r'items')
  BuiltList<AlbumResponseDto> get items;

  @BuiltValueField(wireName: r'total')
  int get total;

  SearchAlbumResponseDto._();

  factory SearchAlbumResponseDto([void updates(SearchAlbumResponseDtoBuilder b)]) = _$SearchAlbumResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchAlbumResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchAlbumResponseDto> get serializer => _$SearchAlbumResponseDtoSerializer();
}

class _$SearchAlbumResponseDtoSerializer implements PrimitiveSerializer<SearchAlbumResponseDto> {
  @override
  final Iterable<Type> types = const [SearchAlbumResponseDto, _$SearchAlbumResponseDto];

  @override
  final String wireName = r'SearchAlbumResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchAlbumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(int),
    );
    yield r'facets';
    yield serializers.serialize(
      object.facets,
      specifiedType: const FullType(BuiltList, [FullType(SearchFacetResponseDto)]),
    );
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AlbumResponseDto)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchAlbumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchAlbumResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.count = valueDes;
          break;
        case r'facets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchFacetResponseDto)]),
          ) as BuiltList<SearchFacetResponseDto>;
          result.facets.replace(valueDes);
          break;
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AlbumResponseDto)]),
          ) as BuiltList<AlbumResponseDto>;
          result.items.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchAlbumResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchAlbumResponseDtoBuilder();
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

