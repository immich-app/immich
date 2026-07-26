import { asHumanReadable } from 'src/utils/bytes';

const KiB = 1024;
const MiB = 1024 * KiB;
const GiB = 1024 * MiB;
const TiB = 1024 * GiB;

describe('asHumanReadable', () => {
  it('renders bytes without decimals', () => {
    expect(asHumanReadable(0)).toBe('0 B');
    expect(asHumanReadable(1)).toBe('1 B');
    expect(asHumanReadable(1023)).toBe('1023 B');
  });

  it('renders whole units', () => {
    expect(asHumanReadable(KiB)).toBe('1.0 KiB');
    expect(asHumanReadable(MiB)).toBe('1.0 MiB');
    expect(asHumanReadable(GiB)).toBe('1.0 GiB');
    expect(asHumanReadable(TiB)).toBe('1.0 TiB');
  });

  it('renders partial units at the requested precision', () => {
    expect(asHumanReadable(512 * KiB)).toBe('512.0 KiB');
    expect(asHumanReadable(1.5 * MiB)).toBe('1.5 MiB');
    expect(asHumanReadable(1.5 * MiB, 3)).toBe('1.500 MiB');
  });

  it('promotes a value that rounds up to a full unit', () => {
    // Rounding for display reaches 1024 of the chosen unit, which it cannot
    // hold -- these used to render as "1024.0 KiB", "1024.0 MiB", "1024.0 GiB".
    expect(asHumanReadable(MiB - 1)).toBe('1.0 MiB');
    expect(asHumanReadable(GiB - 1)).toBe('1.0 GiB');
    expect(asHumanReadable(TiB - 1)).toBe('1.0 TiB');
  });

  it('does not promote when the rounded value still fits', () => {
    expect(asHumanReadable(MiB - KiB)).toBe('1023.0 KiB');
    expect(asHumanReadable(MiB - 1, 6)).toBe('1023.999023 KiB');
  });
});
