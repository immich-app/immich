import { Response } from 'express';
import { DownloadArchive } from './modules/download/download.service';

export const handleDownload = (download: DownloadArchive, res: Response) => {
  res.attachment(download.fileName);
  res.setHeader('X-Immich-Content-Length-Hint', download.fileSize);
  res.setHeader('X-Immich-Archive-File-Count', download.fileCount);
  res.setHeader('X-Immich-Archive-Complete', `${download.complete}`);
  return download.stream;
};
