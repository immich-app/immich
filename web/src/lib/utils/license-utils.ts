const PAYMENT_URL =
  process.env.NODE_ENV == 'development'
    ? 'https://futopay-test.azurewebsites.net/api/v1/activate/'
    : 'https://pay.futo.org/api/v1/activate/';

export async function getActivationKey(licenseKey: string): Promise<string> {
  // const testUrl = 'https://futopay-test.azurewebsites.net/api/v1/activate/IMCL-TQKF-B2PP-YM9B-D5XD-MNT2-9V2X-YF1N-NNTF';
  const response = await fetch(PAYMENT_URL + licenseKey);

  if (!response.ok) {
    throw new Error('Failed to fetch activation key');
  }

  const data = await response.text();

  return data;
}
