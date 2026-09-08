import 'package:path/path.dart' as p;

/// MIME types for extensions that `share_plus` (via `package:mime`) does not
/// know. Without an explicit type, share_plus sends `ACTION_SEND` with
/// `application/octet-stream`, so apps that register `image/*` share targets
/// (Lightroom, Snapseed, ...) are not offered for RAW/HEIF originals.
///
/// Values mirror the vendor forms in `server/src/utils/mime-types.ts` and
/// Android's own `MimeTypeMap`, so a shared file is typed the same way the
/// system gallery would type it.
const Map<String, String> _shareMimeOverrides = {
  '.3fr': 'image/x-hasselblad-3fr',
  '.ari': 'image/x-arriflex-ari',
  '.arw': 'image/x-sony-arw',
  '.cap': 'image/x-phaseone-cap',
  '.cr2': 'image/x-canon-cr2',
  '.cr3': 'image/x-canon-cr3',
  '.crw': 'image/x-canon-crw',
  '.dcr': 'image/x-kodak-dcr',
  '.dng': 'image/x-adobe-dng',
  '.erf': 'image/x-epson-erf',
  '.fff': 'image/x-hasselblad-fff',
  '.iiq': 'image/x-phaseone-iiq',
  '.k25': 'image/x-kodak-k25',
  '.kdc': 'image/x-kodak-kdc',
  '.mrw': 'image/x-minolta-mrw',
  '.nef': 'image/x-nikon-nef',
  '.nrw': 'image/x-nikon-nrw',
  '.orf': 'image/x-olympus-orf',
  '.pef': 'image/x-pentax-pef',
  '.raf': 'image/x-fuji-raf',
  '.raw': 'image/x-panasonic-raw',
  '.rw2': 'image/x-panasonic-rw2',
  '.sr2': 'image/x-sony-sr2',
  '.srf': 'image/x-sony-srf',
  '.srw': 'image/x-samsung-srw',
  '.x3f': 'image/x-sigma-x3f',
  // Nikon writes HEIF as .HIF; package:mime only knows .heic/.heif.
  '.hif': 'image/heif',
};

/// Returns an explicit MIME type for [path] when the default lookup used by
/// `share_plus` would fall back to `application/octet-stream`, or null to let
/// share_plus derive it (jpg, png, heic, mp4, ... are all known to it).
String? shareMimeTypeForPath(String path) => _shareMimeOverrides[p.extension(path).toLowerCase()];
