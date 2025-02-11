import { ArgumentsHost } from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { Request, Response } from 'express';

export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = <T>(param: T | T[]) => (Array.isArray(param) ? param[0] : param);

export const getReqRes = <Req extends Request = Request, Res extends Response = Response>(
  context: ArgumentsHost,
): { type: GqlContextType; req: Req; res: Res } => {
  const type = context.getType<GqlContextType>();
  if (type === 'graphql') {
    const ctx = GqlArgumentsHost.create(context).getContext();
    return { type, req: ctx.req, res: ctx.req.res };
  }

  const http = context.switchToHttp();
  return { type, req: http.getRequest(), res: http.getResponse() };
};
