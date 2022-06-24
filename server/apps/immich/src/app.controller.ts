import { Controller, Get, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
@Controller()
export class AppController {
  @Get()
  async redirectToWebpage(@Res({ passthrough: true }) res: Response, @Headers() headers: Record<string, string>) {
    const host = headers.host;

    return res.redirect(`http://${host}:2285`);
  }
}
