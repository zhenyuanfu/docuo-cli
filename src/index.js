#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  TEMPLATE_GIT_ADDR,
  PACKAGE_JSON_PATH,
  TARGET_DOCUO_VERSION,
  TEMPLATE_PATH,
  DOCS_PATH,
  CMD_EXEC_PATH,
  BUILD_TEMPLATE_PATH,
  BUILD_DOCS_PATH,
  BUILD_PACKAGE_JSON_PATH,
} from "./constants.js";
import childProcess from 'child_process';
import Chalk from 'chalk';
import {
  buildLogger,
  checkPortRecursive,
  copyDir,
  downloadTemplate,
} from "./utils.js";
import { pathToFileURL } from 'node:url';
import fse, { pathExists } from 'fs-extra';
import { Server as SocketServer } from 'socket.io';
import open from 'open';
import chokidar from 'chokidar';

function runCommand(command, cwd) {
  return new Promise((resolve) => {
    const res = childProcess.exec(command, {
      cwd
    }, (err, stdout, stderr) => {
      // console.log(`${command} stdout`, stdout);
      // console.log(`${command} stderr`, stderr);
      // console.log(`${command} err`, err);
      if (err) {
        process.exit(1);
      }
      resolve();
    });
    // console.log(`${command} res`, res);
  })
}

const copyDocsOptions = {
  filter: function(stat, filepath, filename){
    // do not want copy .svn directories
    if (stat === 'directory' && filename === 'docuo-template') {
      return false;
    }
    return true;
  }
}

yargs(hideBin(process.argv)).command(
  'dev',
  'Runs Docuo project locally.',
  () => undefined,
  async (argv) => {
    const port = await checkPortRecursive(argv);
    if (port != undefined) {
      const logger = buildLogger('Preparing local docuo template...');
      const packageJSON = fs.existsSync(PACKAGE_JSON_PATH)
        ? fse.readFileSync(PACKAGE_JSON_PATH, 'utf8')
        : '{}';
      const version = JSON.parse(packageJSON).version;
      const shouldDownload = version !== TARGET_DOCUO_VERSION;
      if (shouldDownload) {
        fse.emptyDirSync(TEMPLATE_PATH);
        logger.text = 'Cloning docuo template...';
        await downloadTemplate(`direct:${TEMPLATE_GIT_ADDR}`, TEMPLATE_PATH);
      }
      logger.text = 'Docuo pnpm installing...';
      await runCommand(`pnpm install`, TEMPLATE_PATH);
      logger.stop();

      fse.emptyDirSync(DOCS_PATH);
      copyDir(CMD_EXEC_PATH, DOCS_PATH, copyDocsOptions);
      process.chdir(TEMPLATE_PATH);

      // console.log(`🌿 ${Chalk.green(`Your local preview is available at http://localhost:${port}`)}`);
      // console.log(`🌿 ${Chalk.green('Press Ctrl+C any time to stop the local preview.')}`);
      const child = childProcess.exec(`pnpm dev --port=${port}`, {
        cwd: TEMPLATE_PATH,
      });
      let opened = false;
      child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
        if (data.includes('Ready') && !opened) {
          opened = true;
          open(`http://localhost:${port}/my-remote-mdx`);
        }
      });
      child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
      });
      child.on('close', function(code) {
        console.log('closing code: ' + code);
      });

      const onChange = () => {
        // TODO reload browser
        console.log('mdxs changed, please reload browser manualy');
      }
      listener(onChange);
    } else {
      console.error(`No available port found.`);
    }
  }
).command(
  'build',
  'Build Docuo project.',
  () => undefined,
  async () => {
    const logger = buildLogger('Preparing local docuo template...');
    const packageJSON = fs.existsSync(BUILD_PACKAGE_JSON_PATH)
      ? fse.readFileSync(PACKAGE_JSON_PATH, 'utf8')
      : '{}';
    const version = JSON.parse(packageJSON).version;
    const shouldDownload = version !== TARGET_DOCUO_VERSION;
    if (shouldDownload) {
      fse.emptyDirSync(BUILD_TEMPLATE_PATH);
      logger.text = 'Cloning docuo template...';
      await downloadTemplate(`direct:${TEMPLATE_GIT_ADDR}`, BUILD_TEMPLATE_PATH);
    }
    logger.text = 'Docuo pnpm installing...';
    await runCommand(`pnpm install`, BUILD_TEMPLATE_PATH);
    logger.stop();

    fse.emptyDirSync(BUILD_DOCS_PATH);
    copyDir(CMD_EXEC_PATH, BUILD_DOCS_PATH, copyDocsOptions);
    process.chdir(BUILD_TEMPLATE_PATH);

    const child = childProcess.exec(`pnpm build`, {
      cwd: BUILD_TEMPLATE_PATH,
    });
    child.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
    });
    child.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
    });
    child.on('close', function(code) {
      console.log('closing code: ' + code);
    });
  }
)
// Print the help menu when the user enters an invalid command.
.strictCommands()
.demandCommand(1, 'Unknown command. See above for the list of supported commands.')

// Alias option flags --help = -h, --version = -v
.alias('h', 'help')
.alias('v', 'version')

.parse();

const listener = (callback) => {
  console.log('listenering dir:', CMD_EXEC_PATH)
  chokidar
      .watch(CMD_EXEC_PATH, {
      ignoreInitial: true,
      ignored: ['node_modules', '.git', '.idea'],
      cwd: CMD_EXEC_PATH,
  })
      .on('add', (filename) => onAddEvent(filename, callback))
      .on('change', (filename) => onChangeEvent(filename, callback))
      // .on('unlink', onUnlinkEvent);
};

const onAddEvent = async (filename, callback) => {
  try {
    await onUpdateEvent(filename, callback);
    console.log('file added: ', filename);
  }
  catch (error) {
    console.error(error.message);
  }
};
const onChangeEvent = async (filename, callback) => {
  try {
    await onUpdateEvent(filename, callback);
    console.log('file edited: ', filename);
  }
  catch (error) {
    console.error(error.message);
  }
};
const onUpdateEvent = async (filename, callback) => {
  fse.emptyDirSync(DOCS_PATH);
  copyDir(CMD_EXEC_PATH, DOCS_PATH, copyDocsOptions);
  callback();
};