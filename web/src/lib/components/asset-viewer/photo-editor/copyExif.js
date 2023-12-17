export default async function copyExif(originalAsset, newBlob) {
  // Retrieve the EXIF data from the original asset
  const exif = await retrieveExif(originalAsset);

  // Create a new blob with the EXIF data and the data from the new blob
  const blobWithExif = new Blob([newBlob.slice(0, 2), exif, newBlob.slice(2)], {
    type: 'image/jpeg',
  });

  return blobWithExif;
}

export const retrieveExif = (imageBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
      const buffer = event.target.result;
      const dataView = new DataView(buffer);
      let offset = 0;

      // Check if the image is a valid JPEG
      if (dataView.getUint16(offset) !== 0xffd8) {
        return reject('Not a valid JPEG');
      }

      offset += 2;

      //TODO: Use some kind of validation to make sure we don't get stuck in an infinite loop
      while (true) {
        const marker = dataView.getUint16(offset);

        // Break if we've reached the start of the image data
        if (marker === 0xffda) {
          break;
        }

        const size = dataView.getUint16(offset + 2);

        // If we've found the EXIF data, return it
        if (marker === 0xffe1 && dataView.getUint32(offset + 4) === 0x45786966) {
          return resolve(imageBlob.slice(offset, offset + 2 + size));
        }

        offset += 2 + size;
      }

      // If there's no EXIF data, return an empty blob
      return resolve(new Blob());
    });

    reader.readAsArrayBuffer(imageBlob);
  });
};
