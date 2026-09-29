import type { Request, Response } from 'express';
import { ImmichQuery } from 'src/enum.js';

export const allowCrossOriginCastMedia = (req: Request, res: Response) => {
  // Cast receivers fetch media from a different origin using a URL-authenticated session.
  // Helmet's default CORP: same-origin blocks the response body after an otherwise successful GET.
  if (typeof req.query[ImmichQuery.SessionKey] !== 'string') {
    return;
  }

  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
};
