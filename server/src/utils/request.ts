export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = (param: string | string[] | undefined) => (Array.isArray(param) ? param[0] : param);
