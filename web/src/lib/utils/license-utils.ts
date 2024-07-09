const PAYMENT_URL =
  process.env.NODE_ENV == 'development'
    ? 'https://futopay-test.azurewebsites.net/api/v1/activate/'
    : 'https://futopay.azurewebsites.net/api/v1/activate/';

export async function getActivationKey(licenseKey: string): Promise<string> {
  // const testUrl = 'https://futopay-test.azurewebsites.net/api/v1/activate/IMCL-TQKF-B2PP-YM9B-D5XD-MNT2-9V2X-YF1N-NNTF';
  const response = await fetch(
    'https://futopay.azurewebsites.net/api/v1/activate/IMCL-TQKF-B2PP-YM9B-D5XD-MNT2-9V2X-YF1N-NNTF',
    {
      method: 'GET',
    },
  );

  console.log(response);

  if (!response.ok) {
    throw new Error('Failed to fetch activation key');
  }

  const data = await response.json();

  return data;
}
