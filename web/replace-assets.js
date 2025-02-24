import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const readDirRecursive = async (filePath) => {
  const dir = await fs.promises.readdir(filePath);
  const files = await Promise.all(dir.map(async relativePath => {
    const absolutePath = path.join(filePath, relativePath);
    const stat = await fs.promises.lstat(absolutePath);
    return stat.isDirectory() ? readDirRecursive(absolutePath) : absolutePath;
  }));
  return files.flat();
};

const processFileWithCompression = (file) => {
  fs.readFile(file,'utf8',(err,data) => {
    fs.writeFile(file,data.replace(/http:\/\/REPLACEME/g,'.'),'utf8',() => {
      console.log(`Write SRC file: ${file}`);
      const fileContent = fs.readFileSync(file);

      const gzFile = file + '.gz';
      const gzContent = zlib.gzipSync(fileContent);
      fs.writeFileSync(gzFile, gzContent);
      console.log(`Generated GZ file: ${gzFile}`);

      const brFile = file + '.br';
      const brContent = zlib.brotliCompressSync(fileContent);
      fs.writeFileSync(brFile, brContent);
      console.log(`Generated BR file: ${brFile}`);
    })
  });
};


const files = await readDirRecursive('./build');
Array.from(files).forEach((file) => {
  if (!(file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.map') || file.endsWith('.css'))) {
    return;
  }
  processFileWithCompression(file);
});
