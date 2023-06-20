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

      case 'avif':
        return {"type": "image", "subType": "avif"};

      case 'insp':
        return {"type": "image", "subType": "jpeg"};

      case 'insv':
        return {"type": "video", "subType": "mp4"};

      case 'arw':
        return {"type": "image", "subType": "x-sony-arw"};

      case 'raf':
        return {"type": "image", "subType": "x-fuji-raf"};

      case 'nef':
        return {"type": "image", "subType": "x-nikon-nef"};

      case 'srw':
        return {"type": "image", "subType": "x-samsung-srw"};

      case 'crw':
        return {"type": "image", "subType": "x-canon-crw"};

      case 'cr2':
        return {"type": "image", "subType": "x-canon-cr2"};

      case 'cr3':
        return {"type": "image", "subType": "x-canon-cr3"};

      case 'erf':
        return {"type": "image", "subType": "x-epson-erf"};

      case 'dcr':
        return {"type": "image", "subType": "x-kodak-dcr"};

      case 'k25':
        return {"type": "image", "subType": "x-kodak-k25"};

      case 'kdc':
        return {"type": "image", "subType": "x-kodak-kdc"};

      case 'mrw':
        return {"type": "image", "subType": "x-minolta-mrw"};

      case 'orf':
        return {"type": "image", "subType": "x-olympus-orf"};

      case 'raw':
        return {"type": "image", "subType": "x-panasonic-raw"};

      case 'pef':
        return {"type": "image", "subType": "x-panasonic-pef"};

      case 'x3f':
        return {"type": "image", "subType": "x-sigma-x3f"};

      case 'srf':
        return {"type": "image", "subType": "x-sony-srf"};

      case 'sr2':
        return {"type": "image", "subType": "x-sony-sr2"};

      case '3fr':
        return {"type": "image", "subType": "x-hasselblad-3fr"};

      case 'fff':
        return {"type": "image", "subType": "x-hasselblad-fff"};

      case 'rwl':
        return {"type": "image", "subType": "x-leica-rwl"};

      case 'ori':
        return {"type": "image", "subType": "x-olympus-ori"};

      case 'iiq':
        return {"type": "image", "subType": "x-phaseone-iiq"};

      case 'ari':
        return {"type": "image", "subType": "x-arriflex-ari"};

      case 'cap':
        return {"type": "image", "subType": "x-phaseone-cap"};

      case 'cin':
        return {"type": "image", "subType": "x-phantom-cin"};

      default:
        return {"type": "unsupport", "subType": "unsupport"};
    }
  }
}
