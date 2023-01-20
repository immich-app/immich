export function patchFormData(latin1: string) {
  return Buffer.from(latin1, 'latin1').toString('utf8');
}
