import type { ratio, filter, edit } from './types';
import { ratios, type mode } from './types';

import { presets } from './presets';
import { Render } from './render';

import { serveFile, uploadFile, updateAssets, type AssetResponseDto } from '@immich/sdk';

type presetName = keyof typeof presets;
type partialFilter = Partial<filter>;

export class Editor {
  private thumbData: Blob | null = null;
  private assetData: Blob | null = null;

  private mode!: mode;

  private asset!: AssetResponseDto;

  private updateHtml!: () => void;

  private imageWrapper!: HTMLElement;
  private image!: HTMLImageElement;
  private cropElement!: HTMLElement;
  private options!: {
    zoomSpeed: number;
    maxZoom: number;
    minZoom: number;
  };

  private edit!: edit;

  private history = new Array<edit>();
  private historyIndex = 0;

  constructor(
    asset: AssetResponseDto,
    imageWrapper: HTMLElement,
    cropElement: HTMLElement,
    options: {
      zoomSpeed: number;
      maxZoom: number;
      minZoom: number;
    } | null,
    updateHtml: () => void,
  ) {
    if (!imageWrapper || !cropElement || !asset) {
      console.log('Editor init error: no image wrapper or image');
      return;
    }
    this.asset = asset;
    this.imageWrapper = imageWrapper;
    this.cropElement = cropElement;
    this.updateHtml = updateHtml;
    this.edit = {
      angle: 0,
      angleOffset: 0,
      aspectRatio: 'original',
      crop: {
        width: 0,
        height: 0,
      },
      flipX: false,
      flipY: false,
      filter: {
        blur: 0,
        brightness: 1,
        contrast: 1,
        grayscale: 0,
        hueRotate: 1,
        invert: 0,
        opacity: 1,
        saturation: 1,
        sepia: 0,
      },
      filterName: 'without',
      translate: {
        x: 0,
        y: 0,
      },
      zoom: 1,
    };

    this.history.push(structuredClone(this.edit));

    if (options) {
      this.options = options;
    } else {
      this.options = {
        zoomSpeed: 0.02,
        maxZoom: 5,
        minZoom: 1,
      };
    }
    this.mode = 'crop';
  }

  /**
   * Sets the mode of the photo editor.
   *
   * @param mode - The mode to set.
   */
  public setMode(mode: mode) {
    this.mode = mode;
    this.updateHtml();
  }

  /**
   * Gets the current mode of the photo editor.
   * @returns The current mode.
   */
  public getMode() {
    return this.mode;
  }

  /**
   * Calculates the dimensions of the image based on the provided parameters and applies the calculated dimensions to the image wrapper element.
   *
   * @param image - The HTMLImageElement representing the image.
   * @param imageWrapper - The HTMLElement representing the image wrapper.
   * @param crop - The HTMLElement representing the crop element.
   * @param edit - The edit object containing angleOffset and angle properties.
   */
  private calcImage = (image: HTMLImageElement, imageWrapper: HTMLElement, crop: HTMLElement, edit: edit) => {
    let newHeight;
    let newWidth;

    const originalAspect = image.naturalWidth / image.naturalHeight;

    const angleOffset = edit.angleOffset;
    const angle = edit.angle;

    // Get crop element width and height
    const cropWidth = crop.offsetWidth;
    const cropHeight = crop.offsetHeight;
    const cropDiagonal = Math.sqrt(cropWidth * cropWidth + cropHeight * cropHeight);

    // Get img element width and height
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;

    let totalAngle = Math.abs(Math.abs(angle) - angleOffset);

    if (angleOffset == 180) {
      totalAngle *= -1;
    }

    const beta = 90 - (Math.asin(cropWidth / cropDiagonal) * 180) / Math.PI;

    const nih = Math.abs(Math.sin(((Math.abs(beta) + totalAngle) * Math.PI) / 180) * cropDiagonal);
    const niw = Math.abs(Math.cos(((Math.abs(beta) - totalAngle) * Math.PI) / 180) * cropDiagonal);

    if (niw / imgWidth > nih / imgHeight) {
      newWidth = `${niw}px`;
      newHeight = `${niw / originalAspect}px`;
    } else {
      newHeight = `${nih}px`;
      newWidth = `${nih * originalAspect}px`;
    }

    imageWrapper.style.height = newHeight;
    imageWrapper.style.width = newWidth;
  };

  /**
   * Sets the crop ratio for the given crop element.
   * @param cropElement - The HTML element representing the crop area.
   * @param ratio - The desired aspect ratio for the crop area.
   * @param wrapperRatio - The aspect ratio of the wrapper element.
   */
  private setCropRatio = (cropElement: HTMLElement, ratio: number, wrapperRatio: number) => {
    cropElement.style.aspectRatio = '' + ratio;

    if (ratio > wrapperRatio) {
      cropElement.style.width = '100%';
      cropElement.style.height = 'auto';
    } else {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
    }
  };

  /**
   * Applies a transformation to the image wrapper based on the provided edit parameters.
   * @param imageWrapper - The HTML element representing the image wrapper.
   * @param edit - The edit parameters containing the angle, angle offset, flipY, translate, and zoom values.
   */
  private transformImage = (imageWrapper: HTMLElement, edit: edit) => {
    const angle = edit.angle;
    const angleOffset = edit.angleOffset;
    const flipY = edit.flipY;
    const translate = edit.translate;
    const zoom = edit.zoom;

    let transformString = '';

    // Add rotation to the transform string.
    transformString += `rotate(${angle - angleOffset}deg)`;

    transformString += ` translate(${translate.x * zoom}px, ${translate.y * zoom}px)`;

    // Add scale to the transform string.
    transformString += ` scaleX(${(flipY ? -1 : 1) * zoom}) scaleY(${(flipY ? -1 : 1) * zoom})`;

    // Set the transform of the image wrapper.

    if (imageWrapper && imageWrapper.style) {
      console.log('Transforming');

      imageWrapper.style.transform = transformString;
    }
  };

  /**
   * Updates the photo editor.
   * This method performs various calculations and transformations to update the editor's state.
   * @throws {Error} If there is no crop wrapper element.
   */
  private async update() {
    console.log('update');
    console.log(this.edit);

    const crop = this.cropElement;
    const cropWrapper = crop.parentElement;
    const image = this.image;
    const imageWrapper = this.imageWrapper;
    const edit = this.edit;
    const filter = edit.filter;

    console.log(cropWrapper);

    if (!cropWrapper) {
      throw new Error('No crop wrapper');
    }

    if (!image) {
      throw new Error('No image');
    }

    const ratio = this.getRatio(edit.aspectRatio, image.naturalWidth / image.naturalHeight);

    const wrapperRatio = cropWrapper.offsetWidth / cropWrapper.offsetHeight;

    this.setCropRatio(this.cropElement, ratio, wrapperRatio);

    this.calcImage(this.image, this.imageWrapper, this.cropElement, edit);

    const [maxX, maxY] = this.maxXY();
    console.log('maxX: ' + maxX);
    console.log('maxY: ' + maxY);

    let [x, y] = [edit.translate.x, edit.translate.y];

    console.log('x: ' + x);
    console.log('y: ' + y);

    if (x > maxX) {
      x = maxX;
    } else if (x < -maxX) {
      x = -maxX;
    }

    if (y > maxY) {
      y = maxY;
    } else if (y < -maxY) {
      y = -maxY;
    }

    this.edit.translate = {
      x: x,
      y: y,
    };

    this.transformImage(imageWrapper, edit);
    this.imageWrapper.innerHTML = '';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.filter = `blur(${filter.blur * 10}px) brightness(${filter.brightness}) contrast(${
      filter.contrast
    }) grayscale(${filter.grayscale}) hue-rotate(${(filter.hueRotate - 1) * 180}deg) invert(${filter.invert}) opacity(${
      filter.opacity
    }) saturate(${filter.saturation}) sepia(${filter.sepia})`;
    this.imageWrapper.appendChild(image);
    this.updateHtml();
  }
  /**
   * Loads the data for the photo editor.
   * This method loads the thumbnail and asset data, creates an image element, and appends it to the image wrapper.
   * @throws {Error} If failed to load data.
   */
  public async loadData() {
    console.log('loadData');
    try {
      await this.loadThumb();
      await this.loadAsset();
      this.image = new Image();
      if (this.thumbData) {
        this.image.src = URL.createObjectURL(this.thumbData);
        await this.image.decode();
      } else if (this.assetData) {
        this.image.src = URL.createObjectURL(this.assetData);
        await this.image.decode();
      } else {
        throw new Error('Failed to load data');
      }
      this.update();
    } catch (error) {
      throw new Error('Failed to load data');
    }
  }

  /**
   * Calculates the aspect ratio based on the given ratio and original aspect.
   * @param ratio - The desired ratio as string.
   * @param originalAspect - The original aspect ratio.
   * @returns The calculated aspect ratio.
   */
  private getRatio = (ratio: ratio, originalAspect: number) => {
    switch (ratio) {
      case 'free':
        // free ratio selection
        return 0;
      case 'square':
        return 1;
      case 'original':
        if (this.edit.angleOffset % 180 !== 0) {
          return 1 / originalAspect;
        } else {
          return originalAspect;
        }
      case '16_9':
        return 16 / 9;
      case '9_16':
        return 9 / 16;
      case '5_4':
        return 5 / 4;
      case '4_5':
        return 4 / 5;
      case '4_3':
        return 4 / 3;
      case '3_4':
        return 3 / 4;
      case '3_2':
        return 3 / 2;
      case '2_3':
        return 2 / 3;
      default:
        return originalAspect;
    }
  };

  /**
   * Loads the thumbnail data for the asset.
   * @throws {Error} If failed to load thumb data.
   */
  private async loadThumb() {
    console.log('loadThumb');

    try {
      const data = await serveFile(
        { id: this.asset.id, isThumb: true, isWeb: true }
      );

      if (!(data instanceof Blob)) {
        throw new Error('Failed to load thumb data');
      }

      this.thumbData = data;
    } catch {
      throw new Error('Failed to load thumb data');
    }
  }

  /**
   * Downloads the asset data from the server and assigns it to the `assetData` property.
   * @throws {Error} If failed to load asset data.
   */
  private async loadAsset() {
    console.log('loadAsset');
    try {
      const data = await serveFile(
        { id: this.asset.id },
      );

      if (!(data instanceof Blob)) {
        throw new Error('Failed to load asset data');
      }
      this.assetData = data;
    } catch {
      throw new Error('Failed to load asset data');
    }
  }

  /**
   * Saves the current edit state and adds it to the history.
   */
  public save() {
    console.log('save');
    console.log(this);
    console.log(this.history);

    if (!this.history) {
      throw new Error('No history');
    }

    const edit = structuredClone(this.edit);
    this.history.push(edit);
    this.historyIndex++;
    this.updateHtml();
  }

  /**
   * Renders the photo editor.
   * @returns A promise that resolves when the rendering is complete.
   */
  public async render() {
    console.log('render');

    const name = this.asset.originalFileName;
    const asset = this.assetData;

    this.edit.crop = {
      width: this.cropElement.offsetWidth,
      height: this.cropElement.offsetHeight,
    };
    if (!asset) {
      throw new Error('No asset data');
    }

    const render = new Render(name, asset, this.edit, this.imageWrapper);
    return await render.start();
  }

  /**
   * Uploads a blob to the server.
   * Then links the uploaded file to the asset.
   *
   * @param blob - The blob to be uploaded.
   * @throws Error if the file upload fails.
   */
  public async upload(blob: Blob) {
    console.log('upload');

    const fileType = blob.type.split('/')[1];

    const assetData = new File([blob], this.asset.originalFileName + '.' + fileType, {
      lastModified: new Date().getTime(),
    });

    const data = await uploadFile({createAssetDto:{
      assetData: assetData,
      deviceAssetId: this.asset.deviceAssetId,
      deviceId: this.asset.deviceId,
      fileCreatedAt: this.asset.fileCreatedAt,
      fileModifiedAt: new Date().toUTCString(),},
    });

    if (!data) {
      throw new Error('Failed to upload file');
    }

    const id = data.id;
    const stackData = await updateAssets({
      assetBulkUpdateDto: {
        ids: [id],
        stackParentId: this.asset.id,
      },
    });

    if (!stackData) {
      throw new Error('Failed to link file');
    }
  }

  /**
   * Undo the previous edit action.
   * Throws an error if there is no more history to undo.
   *
   * @throws {Error} No more history to undo
   */
  public undo() {
    console.log('undo');

    if (this.historyIndex < 1) {
      throw new Error('No more history');
    }
    this.historyIndex--;
    this.edit = structuredClone(this.history[this.historyIndex]);

    this.update();
  }

  /**
   * Redo the previous edit action.
   * Throws an error if there is no more history to redo.
   *
   * @throws {Error} No more history to redo
   */
  public redo() {
    console.log('redo');

    if (this.historyIndex >= this.history.length - 1) {
      throw new Error('No more history');
    }
    this.historyIndex++;
    this.edit = structuredClone(this.history[this.historyIndex]);

    this.update();
  }

  /**
   * Clear the edit history.
   * Only the current edit will remain.
   *
   * @throws {Error} History is empty
   */
  public clear() {
    console.log('clear');

    if (this.history.length < 1) {
      throw new Error('No history'); //History must not be empty
    }

    if (this.history.length < 2) {
      return;
    }
    this.history.splice(1, this.history.length - 1, structuredClone(this.edit));
    this.historyIndex = 1;
    this.updateHtml();
  }

  //TODO: decide if we want to clear the history or not
  /**
   * Reset the edit to the initial state.
   * This will also clear the edit history.
   *
   * @throws {Error} History is empty
   */
  public reset() {
    console.log('reset');

    if (this.history.length < 1) {
      throw new Error('No history'); //History must not be empty
    }
    this.edit = structuredClone(this.history[0]);
    this.historyIndex = 0;
    this.history.splice(1, this.history.length - 1);

    this.update();
  }

  public getAngle() {
    return this.edit.angle;
  }

  /**
   * Rotates the photo by 90 degrees.
   */
  public rotate90() {
    console.log('rotate90');

    this.edit.angleOffset += 90;
    this.edit.angleOffset %= 360;

    this.update();
  }

  /**
   * Rotates the photo by the specified angle.
   * If the angle is 0, the photo will be rotated by 90 degrees.
   *
   * @param angle - The angle to rotate the photo by. Must be between 0 and 45.
   * @throws {Error} If the angle is invalid (not between -45 and 45).
   */
  public rotate(angle = 0) {
    console.log('rotate');

    if (!(angle >= -45 && angle <= 45)) {
      throw new Error('Invalid angle'); //Angle must be between -45 and 45
    }

    this.edit.angle = angle;
    this.update();
  }

  /**
   * Flips the photo horizontally and/or vertically.
   *
   * @param x - A boolean indicating whether to flip the photo horizontally.
   * @param y - A boolean indicating whether to flip the photo vertically.
   *
   * @throws {Error} If both x and y are false.
   */
  public flip(x: boolean, y: boolean) {
    if (!x && !y) {
      throw new Error('Invalid flip'); //At least one of x and y must be true
    }

    if (x) {
      console.log('flipX');

      this.edit.flipX = !this.edit.flipX;
    }
    if (y) {
      console.log('flipY');

      this.edit.flipY = !this.edit.flipY;
    }

    this.update();
  }

  /**
   * Downloads a blob as a file with the specified name.
   *
   * @param blob - The blob to download.
   * @param name - The name of the downloaded file.
   */
  public download(blob: Blob, name: string) {
    console.log('download');
    window.setTimeout(() => {
      const link = document.createElement('a');
      link.download = name;
      link.href = URL.createObjectURL(blob);
      link.click();
    }, 0);
  }

  /**
   * Zooms the photo editor by the specified scale.
   *
   * @param scale - The scale factor to zoom by. Must be 1 or -1 when wheel is true.
   * @param wheel - Indicates whether the zoom is triggered by a wheel event. Default is false.
   * @throws {Error} if the scale is invalid when wheel is true.
   */
  public zoom(scale: number, wheel = false) {
    console.log('zoom');

    console.log(this.options);
    console.log(this);

    if (wheel && !(scale == -1 || scale == 1)) {
      throw new Error('Invalid zoom'); //Scale must be 1 or -1 when wheel is true
    }

    if (wheel) {
      this.edit.zoom += this.options.zoomSpeed * 5 * scale;
    } else {
      if (scale > 1) {
        this.edit.zoom += this.options.zoomSpeed * scale;
      } else {
        this.edit.zoom -= this.options.zoomSpeed / scale;
      }
    }

    if (this.edit.zoom > this.options.maxZoom) {
      this.edit.zoom = this.options.maxZoom;
    } else if (this.edit.zoom < this.options.minZoom) {
      this.edit.zoom = this.options.minZoom;
    }

    console.log(this.edit.zoom);

    this.update();
  }

  /**
   * Calculates the maximum X and Y coordinates based on the current editor settings.
   *
   * @returns An array containing the maximum X and Y coordinates.
   */
  private maxXY() {
    const imageWrapper = this.imageWrapper;
    const crop = this.cropElement;
    const edit = this.edit;
    const angleOffset = edit.angleOffset;
    const angle = edit.angle;

    // Get crop element width and height
    const cropWidth = crop.offsetWidth;
    const cropHeight = crop.offsetHeight;
    const cropDiagonal = Math.sqrt(cropWidth * cropWidth + cropHeight * cropHeight);

    // Get img element width and height
    const imgWrapperWidth = imageWrapper.offsetWidth;
    const imgWrapperHeight = imageWrapper.offsetHeight;

    let totalAngle = Math.abs(Math.abs(angle) - angleOffset);

    if (angleOffset == 180) {
      totalAngle *= -1;
    }

    const beta = 90 - (Math.asin(cropWidth / cropDiagonal) * 180) / Math.PI;

    const nih = Math.abs(Math.sin(((Math.abs(beta) + totalAngle) * Math.PI) / 180) * cropDiagonal);
    const niw = Math.abs(Math.cos(((Math.abs(beta) - totalAngle) * Math.PI) / 180) * cropDiagonal);

    const maxX = (imgWrapperWidth * edit.zoom - niw) / (2 * edit.zoom);
    const maxY = (imgWrapperHeight * edit.zoom - nih) / (2 * edit.zoom);

    return [maxX, maxY];
  }

  /**
   * Translates the photo editor view by the specified delta values.
   *
   * @param x - The amount to translate along the x-axis.
   * @param y - The amount to translate along the y-axis.
   */
  public pan(x: number, y: number) {
    console.log('pan');
    console.log('x: ' + x);
    console.log('y: ' + y);

    const angleOffset = this.edit.angleOffset;
    const [maxX, maxY] = this.maxXY();

    if (angleOffset === 90) {
      const tmp = x;
      x = -y;
      y = tmp;
    }

    if (angleOffset === 270) {
      const tmp = x;
      x = -y;
      y = tmp;
    }

    if (angleOffset === 180 || angleOffset === 270) {
      x = -x;
      y = -y;
    }

    if (x > maxX) {
      x = maxX;
    } else if (x < -maxX) {
      x = -maxX;
    }

    if (y > maxY) {
      y = maxY;
    } else if (y < -maxY) {
      y = -maxY;
    }

    this.edit.translate = {
      x: x,
      y: y,
    };

    console.log(this.edit.translate);

    this.update();
  }

  public canUndo() {
    return this.historyIndex > 0;
  }

  public canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  public getRatioString() {
    return this.edit.aspectRatio;
  }

  public getFilter() {
    return structuredClone(this.edit.filter);
  }

  /**
   * Sets the aspect ratio for the photo editor.
   *
   * @param ratio - The aspect ratio to set.
   * @throws Error if there is no image or if the ratio is invalid.
   */
  public ratio(ratio: ratio) {
    console.log('ratio');

    if (!this.image) {
      throw new Error('No image');
    }

    if (this.edit.angleOffset === 90 || this.edit.angleOffset === 270) {
      const t = ratio.split('_').reverse().join('_');
      if (ratios.indexOf(t) < 0) {
        throw new Error('Invalid ratio');
      }
      ratio = t;
    }

    this.edit.aspectRatio = ratio;

    this.update();
  }

  /**
   * Applies the specified filter to the photo editor.
   *
   * @param filter - The filter object containing the filter properties.
   * @throws Error if the filter object is invalid / is empty.
   */
  public filter(filter: partialFilter) {
    console.log('filter');

    if (Object.keys(filter).length === 0) {
      throw new Error('Invalid filter');
    }

    const blur = filter.blur;
    const brightness = filter.brightness;
    const contrast = filter.contrast;
    const grayscale = filter.grayscale;
    const hueRotate = filter.hueRotate;
    const invert = filter.invert;
    const opacity = filter.opacity;
    const saturation = filter.saturation;
    const sepia = filter.sepia;

    if (blur !== undefined && blur >= 0 && blur <= 1) {
      this.edit.filter.blur = blur;
    }
    if (brightness !== undefined && brightness >= 0 && brightness <= 2) {
      this.edit.filter.brightness = brightness;
    }
    if (contrast !== undefined && contrast >= 0 && contrast <= 2) {
      this.edit.filter.contrast = contrast;
    }
    if (grayscale !== undefined && grayscale >= 0 && grayscale <= 1) {
      this.edit.filter.grayscale = grayscale;
    }
    if (hueRotate !== undefined && hueRotate >= 0 && hueRotate <= 2) {
      this.edit.filter.hueRotate = hueRotate;
    }
    if (invert !== undefined && invert >= 0 && invert <= 1) {
      this.edit.filter.invert = invert;
    }
    if (opacity !== undefined && opacity >= 0 && opacity <= 1) {
      this.edit.filter.opacity = opacity;
    }
    if (saturation !== undefined && saturation >= 0 && saturation <= 2) {
      this.edit.filter.saturation = saturation;
    }
    if (sepia !== undefined && sepia >= 0 && sepia <= 1) {
      this.edit.filter.sepia = sepia;
    }

    if (this.isWithout(this.edit.filter)) {
      this.edit.filterName = 'without';
    }

    this.update();
  }

  private isWithout(filter: filter) {
    return (
      filter.blur === 0 &&
      filter.brightness === 1 &&
      filter.contrast === 1 &&
      filter.grayscale === 0 &&
      filter.hueRotate === 1 &&
      filter.invert === 0 &&
      filter.opacity === 1 &&
      filter.saturation === 1 &&
      filter.sepia === 0
    );
  }

  /**
   * Applies a preset filter to the photo editor.
   *
   * @param name - The name of the preset filter to apply.
   */
  public preset(name: presetName) {
    console.log('preset');

    const preset = presets[name];
    this.edit.filterName = name;
    this.filter(preset);
  }

  /**
   * Gets the preset filter name applied in the photo editor.
   * @returns The name of the preset filter.
   */
  public getPreset() {
    return this.edit.filterName;
  }

  /**
   * Retrieves the thumbnail data.
   * @returns The thumbnail data.
   * @throws Error if no thumbnail data is available.
   */
  public getThumbData() {
    if (!this.thumbData) {
      throw new Error('No thumb data');
    }
    return this.thumbData;
  }
}
