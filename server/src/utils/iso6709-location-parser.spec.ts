import { parseIso6709Location } from 'src/utils/iso6709-location-parser';

describe('parseIso6709Location', () => {
  it('Empty string', () => {
    expect(parseIso6709Location('')).toEqual({
      hasGeo: false,
      latitude: null,
      longitude: null,
      error: 'Input must be a non-empty string.',
    });
  });
  it('Latitude + Longitude + Altitude', () => {
    expect(parseIso6709Location('+37.4039-122.0131+13.000000/')).toEqual({
      hasGeo: true,
      latitude: 37.4039,
      longitude: -122.0131,
    });
  });
  it('Latitude + Longitude + Altitude ±DDMM.M±DDDMM.M', () => {
    expect(parseIso6709Location('+4012.22-07500.25+13.000000/')).toEqual({
      hasGeo: true,
      // eslint-disable-next-line unicorn/numeric-separators-style
      latitude: 40.20366666666666,
      // eslint-disable-next-line unicorn/numeric-separators-style
      longitude: -75.00416666666666,
    });
  });
  it('Latitude + Longitude + Altitude ±DDMMSS.S±DDDMMSS.S', () => {
    expect(parseIso6709Location('+401213.1-0750015.1+13.000000/')).toEqual({
      hasGeo: true,
      // eslint-disable-next-line unicorn/numeric-separators-style
      latitude: 40.20363888888889,
      // eslint-disable-next-line unicorn/numeric-separators-style
      longitude: -75.00419444444445,
    });
  });
  it('Latitude + Longitude', () => {
    expect(parseIso6709Location('+37.4039-122.0131/')).toEqual({
      hasGeo: true,
      latitude: 37.4039,
      longitude: -122.0131,
    });
  });
  it('DMS format', () => {
    expect(parseIso6709Location('+374024-1220825/')).toEqual({
      hasGeo: true,
      // eslint-disable-next-line unicorn/numeric-separators-style
      latitude: 37.67333333333333,
      // eslint-disable-next-line unicorn/numeric-separators-style
      longitude: -122.14027777777778,
    });
  });
  it('CRS format', () => {
    expect(parseIso6709Location('+37.4039-122.0131+15CRSWGS84/')).toEqual({
      hasGeo: true,
      latitude: 37.4039,
      longitude: -122.0131,
    });
  });
  it('Wikipedia examples - Atlantic ocean', () => {
    expect(parseIso6709Location('+00-025/')).toEqual({
      hasGeo: true,
      latitude: 0,
      longitude: -25,
    });
  });
  it('Wikipedia examples - France', () => {
    expect(parseIso6709Location('+46+002/')).toEqual({
      hasGeo: true,
      latitude: 46,
      longitude: 2,
    });
    expect(parseIso6709Location('+48.52+002.20/')).toEqual({
      hasGeo: true,
      latitude: 48.52,
      longitude: 2.2,
    });
    expect(parseIso6709Location('+48.8577+002.295/')).toEqual({
      hasGeo: true,
      latitude: 48.8577,
      longitude: 2.295,
    });
  });
  it('Wikipedia examples - Mount Everest', () => {
    expect(parseIso6709Location('+27.5916+086.5640+8850CRSWGS_84/')).toEqual({
      hasGeo: true,
      latitude: 27.5916,
      longitude: 86.564,
    });
  });
  it('Wikipedia examples - North Pole', () => {
    expect(parseIso6709Location('+90+000/')).toEqual({
      hasGeo: true,
      latitude: 90,
      longitude: 0,
    });
  });
  it('Wikipedia examples - South Pole', () => {
    expect(parseIso6709Location('-90+000+2800CRSWGS_84/')).toEqual({
      hasGeo: true,
      latitude: -90,
      longitude: 0,
    });
  });
});
