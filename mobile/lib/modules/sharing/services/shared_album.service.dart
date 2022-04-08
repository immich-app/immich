import 'package:immich_mobile/shared/services/network.service.dart';

class SharedAlbumService {
  final NetworkService _networkService = NetworkService();

  getAllSharedAlbum() async {
    var res = await _networkService.getRequest(url: 'shared/allSharedAlbums');
  }
}
