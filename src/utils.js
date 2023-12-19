import copydir from 'copy-dir';
import fs from 'fs';
import detect from 'detect-port';
import { createInterface } from 'readline';
import download from 'download-git-repo';
import Ora from 'ora';

export const buildLogger = (startText = '') => {
    const logger = Ora().start(startText);
    return logger;
};

export function downloadTemplate(url, targetPath) {
  return new Promise((resolve) => {
    download(url, targetPath, {clone: true}, (err) => {
        if (err) {
          console.log('clone template err', err);
          process.exit(1);
        } else {
          // console.log('clone success!')
          resolve();
        }
      });
  });
}

export function copyDir(from, to, options) {
  copydir.sync(from, to, options);
}

export function checkMkdirExists(path) {
  return fs.existsSync(path)
};

const confirm = async (question) => {
  return new Promise((resolve) => {
    const cmdInterface = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    cmdInterface.question(question, (response) => {
      cmdInterface.close();
      resolve(response.toLowerCase() === "y");
    });
  });
}

export const checkPortRecursive = async (argv) => {
  const port = argv.port || 3000;
  const _port = await detect(port);

  if (port == _port) {
    return port;
  }

  const confirmed = await confirm(
    `Port ${port} is already in use. Use port ${_port} instead? [Y/n]\n`
  );

  if (confirmed) {
    return await checkPortRecursive({
      ...argv,
      port: _port,
    });
  }
  return undefined;
};
