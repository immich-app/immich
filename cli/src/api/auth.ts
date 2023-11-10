export const auth = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});
