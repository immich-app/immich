import 'package:path/path.dart' as p;

class FileHelper {
  static getMimeType(String filePath) {
    var fileExtension = p.extension(filePath).split(".")[1];

    switch (fileExtension.toLowerCase()) {
      case 'gif':
        return {"type": "image", "subType": "gif"};

      case 'jpeg':
        return {"type": "image", "subType": "jpeg"};

      case 'jpg':
        return {"type": "image", "subType": "jpeg"};

      case 'png':
        return {"type": "image", "subType": "png"};

      case 'tif':
        return {"type": "image", "subType": "tiff"};

      case 'mov':
        return {"type": "video", "subType": "quicktime"};

      case 'mp4':
        return {"type": "video", "subType": "mp4"};

      case 'avi':
        return {"type": "video", "subType": "x-msvideo"};

      case 'heic':
        return {"type": "image", "subType": "heic"};

      case 'heif':
        return {"type": "image", "subType": "heif"};

      case 'dng':
        return {"type": "image", "subType": "dng"};

      case 'webp':
        return {"type": "image", "subType": "webp"};

      case '3gp':
        return {"type": "video", "subType": "3gpp"};

      case 'webm':
        return {"type": "video", "subType": "webm"};

      case 'insp':
        return {"type": "image", "subType": "jpeg"};

      case 'insv':
        return {"type": "video", "subType": "mp4"};

      case 'arw':
        return {"type": "image", "subType": "x-sony-arw"};

      default:
        return {"type": "unsupport", "subType": "unsupport"};
    }
  }
}
