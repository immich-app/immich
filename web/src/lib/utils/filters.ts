import type { FilterParameters } from '@immich/sdk';

export class EditFilter {
  name: string;

  rrBias: number;
  rgBias: number;
  rbBias: number;
  grBias: number;
  ggBias: number;
  gbBias: number;
  brBias: number;
  bgBias: number;
  bbBias: number;

  rOffset: number;
  gOffset: number;
  bOffset: number;

  static identity = new EditFilter({
    name: 'Normal',
    rrBias: 1,
    rgBias: 0,
    rbBias: 0,
    grBias: 0,
    ggBias: 1,
    gbBias: 0,
    brBias: 0,
    bgBias: 0,
    bbBias: 1,
    rOffset: 0,
    gOffset: 0,
    bOffset: 0,
  });

  constructor(filter: {
    name: string;
    rrBias: number;
    rgBias: number;
    rbBias: number;
    grBias: number;
    ggBias: number;
    gbBias: number;
    brBias: number;
    bgBias: number;
    bbBias: number;
    rOffset: number;
    gOffset: number;
    bOffset: number;
  }) {
    this.name = filter.name;
    this.rrBias = filter.rrBias;
    this.rgBias = filter.rgBias;
    this.rbBias = filter.rbBias;
    this.grBias = filter.grBias;
    this.ggBias = filter.ggBias;
    this.gbBias = filter.gbBias;
    this.brBias = filter.brBias;
    this.bgBias = filter.bgBias;
    this.bbBias = filter.bbBias;
    this.rOffset = filter.rOffset;
    this.gOffset = filter.gOffset;
    this.bOffset = filter.bOffset;
  }

  get dtoParameters(): FilterParameters {
    return {
      rrBias: this.rrBias,
      rgBias: this.rgBias,
      rbBias: this.rbBias,
      grBias: this.grBias,
      ggBias: this.ggBias,
      gbBias: this.gbBias,
      brBias: this.brBias,
      bgBias: this.bgBias,
      bbBias: this.bbBias,
      rOffset: this.rOffset,
      gOffset: this.gOffset,
      bOffset: this.bOffset,
    };
  }

  get svgFilter(): string {
    return `
        ${this.rrBias} ${this.rgBias} ${this.rbBias} 0  ${this.rOffset}
        ${this.grBias} ${this.ggBias} ${this.gbBias} 0  ${this.gOffset}
        ${this.brBias} ${this.bgBias} ${this.bbBias} 0  ${this.bOffset}
        0          0          0          1  0
    `;
  }

  static fromDto(params: FilterParameters, name: string): EditFilter {
    return new EditFilter({
      name,
      ...params,
    });
  }

  static fromMatrix(matrix: number[], name: string): EditFilter {
    return new EditFilter({
      name,
      rrBias: matrix[0],
      rgBias: matrix[1],
      rbBias: matrix[2],
      grBias: matrix[5],
      ggBias: matrix[6],
      gbBias: matrix[7],
      brBias: matrix[10],
      bgBias: matrix[11],
      bbBias: matrix[12],
      rOffset: matrix[15],
      gOffset: matrix[16],
      bOffset: matrix[17],
    });
  }

  get isIdentity(): boolean {
    return this.equals(EditFilter.identity);
  }

  equals(other: EditFilter): boolean {
    return (
      this.rrBias === other.rrBias &&
      this.rgBias === other.rgBias &&
      this.rbBias === other.rbBias &&
      this.grBias === other.grBias &&
      this.ggBias === other.ggBias &&
      this.gbBias === other.gbBias &&
      this.brBias === other.brBias &&
      this.bgBias === other.bgBias &&
      this.bbBias === other.bbBias &&
      this.rOffset === other.rOffset &&
      this.gOffset === other.gOffset &&
      this.bOffset === other.bOffset
    );
  }

  get cssId(): string {
    return this.name.toLowerCase().replaceAll(/\s+/g, '-');
  }
}

export const filters: EditFilter[] = [
  //Original
  EditFilter.fromMatrix([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0], 'Original'),
  //Vintage
  EditFilter.fromMatrix([0.8, 0.1, 0.1, 0, 20, 0.1, 0.8, 0.1, 0, 20, 0.1, 0.1, 0.8, 0, 20, 0, 0, 0, 1, 0], 'Vintage'),
  //Mood
  EditFilter.fromMatrix([1.2, 0.1, 0.1, 0, 10, 0.1, 1, 0.1, 0, 10, 0.1, 0.1, 1, 0, 10, 0, 0, 0, 1, 0], 'Mood'),
  //Crisp
  EditFilter.fromMatrix([1.2, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], 'Crisp'),
  //Cool
  EditFilter.fromMatrix([0.9, 0, 0.2, 0, 0, 0, 1, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], 'Cool'),
  //Blush
  EditFilter.fromMatrix([1.1, 0.1, 0.1, 0, 10, 0.1, 1, 0.1, 0, 10, 0.1, 0.1, 1, 0, 5, 0, 0, 0, 1, 0], 'Blush'),
  //Sunkissed
  EditFilter.fromMatrix([1.3, 0, 0.1, 0, 15, 0, 1.1, 0.1, 0, 10, 0, 0, 0.9, 0, 5, 0, 0, 0, 1, 0], 'Sunkissed'),
  //Fresh
  EditFilter.fromMatrix([1.2, 0, 0, 0, 20, 0, 1.2, 0, 0, 20, 0, 0, 1.1, 0, 20, 0, 0, 0, 1, 0], 'Fresh'),
  //Classic
  EditFilter.fromMatrix([1.1, 0, -0.1, 0, 10, -0.1, 1.1, 0.1, 0, 5, 0, -0.1, 1.1, 0, 0, 0, 0, 0, 1, 0], 'Classic'),
  //Lomo-ish
  EditFilter.fromMatrix([1.5, 0, 0.1, 0, 0, 0, 1.45, 0, 0, 0, 0.1, 0, 1.3, 0, 0, 0, 0, 0, 1, 0], 'Lomo-ish'),
  //Nashville
  EditFilter.fromMatrix(
    [1.2, 0.15, -0.15, 0, 15, 0.1, 1.1, 0.1, 0, 10, -0.05, 0.2, 1.25, 0, 5, 0, 0, 0, 1, 0],
    'Nashville',
  ),
  //Valencia
  EditFilter.fromMatrix([1.15, 0.1, 0.1, 0, 20, 0.1, 1.1, 0, 0, 10, 0.1, 0.1, 1.2, 0, 5, 0, 0, 0, 1, 0], 'Valencia'),
  //Clarendon
  EditFilter.fromMatrix([1.2, 0, 0, 0, 10, 0, 1.25, 0, 0, 10, 0, 0, 1.3, 0, 10, 0, 0, 0, 1, 0], 'Clarendon'),
  //Moon
  EditFilter.fromMatrix(
    [0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0, 0, 0, 1, 0],
    'Moon',
  ),
  //Willow
  EditFilter.fromMatrix([0.5, 0.5, 0.5, 0, 20, 0.5, 0.5, 0.5, 0, 20, 0.5, 0.5, 0.5, 0, 20, 0, 0, 0, 1, 0], 'Willow'),
  //Kodak
  EditFilter.fromMatrix([1.3, 0.1, -0.1, 0, 10, 0, 1.25, 0.1, 0, 10, 0, -0.1, 1.1, 0, 5, 0, 0, 0, 1, 0], 'Kodak'),
  //Sunset
  EditFilter.fromMatrix([1.5, 0.2, 0, 0, 0, 0.1, 0.9, 0.1, 0, 0, -0.1, -0.2, 1.3, 0, 0, 0, 0, 0, 1, 0], 'Sunset'),
  //Noir
  EditFilter.fromMatrix([1.3, -0.3, 0.1, 0, 0, -0.1, 1.2, -0.1, 0, 0, 0.1, -0.2, 1.3, 0, 0, 0, 0, 0, 1, 0], 'Noir'),
  //Dreamy
  EditFilter.fromMatrix([1.1, 0.1, 0.1, 0, 0, 0.1, 1.1, 0.1, 0, 0, 0.1, 0.1, 1.1, 0, 15, 0, 0, 0, 1, 0], 'Dreamy'),
  //Sepia
  EditFilter.fromMatrix(
    [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0],
    'Sepia',
  ),
  //Radium
  EditFilter.fromMatrix(
    [1.438, -0.062, -0.062, 0, 0, -0.122, 1.378, -0.122, 0, 0, -0.016, -0.016, 1.483, 0, 0, 0, 0, 0, 1, 0],
    'Radium',
  ),
  //Aqua
  EditFilter.fromMatrix(
    [0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.7873, 0.2848, 0.9278, 0, 0, 0, 0, 0, 1, 0],
    'Aqua',
  ),
  //Purple Haze
  EditFilter.fromMatrix([1.3, 0, 1.2, 0, 0, 0, 1.1, 0, 0, 0, 0.2, 0, 1.3, 0, 0, 0, 0, 0, 1, 0], 'Purple Haze'),
  //Lemonade
  EditFilter.fromMatrix([1.2, 0.1, 0, 0, 0, 0, 1.1, 0.2, 0, 0, 0.1, 0, 0.7, 0, 0, 0, 0, 0, 1, 0], 'Lemonade'),
  //Caramel
  EditFilter.fromMatrix([1.6, 0.2, 0, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0, 0.1, 0.9, 0, 0, 0, 0, 0, 1, 0], 'Caramel'),
  //Peachy
  EditFilter.fromMatrix([1.3, 0.5, 0, 0, 0, 0.2, 1.1, 0.3, 0, 0, 0.1, 0.1, 1.2, 0, 0, 0, 0, 0, 1, 0], 'Peachy'),
  //Neon
  EditFilter.fromMatrix([1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0], 'Neon'),
  //Cold Morning
  EditFilter.fromMatrix([0.9, 0.1, 0.2, 0, 0, 0, 1, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], 'Cold Morning'),
  //Lush
  EditFilter.fromMatrix([0.9, 0.2, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 0, 1, 0], 'Lush'),
  //Urban Neon
  EditFilter.fromMatrix([1.1, 0, 0.3, 0, 0, 0, 0.9, 0.3, 0, 0, 0.3, 0.1, 1.2, 0, 0, 0, 0, 0, 1, 0], 'Urban Neon'),
  //Monochrome
  EditFilter.fromMatrix([0.6, 0.2, 0.2, 0, 0, 0.2, 0.6, 0.2, 0, 0, 0.2, 0.2, 0.7, 0, 0, 0, 0, 0, 1, 0], 'Monochrome'),
];
