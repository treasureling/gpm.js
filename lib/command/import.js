/**
 * Created by axetroy on 17-2-15.
 */
const path = require('path');
const process = require('process');
const _ = require('lodash');
const prettyjson = require('prettyjson');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const log4js = require('log4js');
const gitUrlParse = require("git-url-parse");
const inquirer = require('inquirer');
const co = require('co');

const prompt = inquirer.createPromptModule();
const logger = log4js.getLogger('IMPORT');
const config = require('../config');
const {isGitRepoDir, parseGitConfigAsync, isExistPath, isLink} = require('../utils');

function *importHandlerOneDir(targetPath, options) {
  targetPath = path.resolve(process.cwd(), targetPath);
  const isGitDir = yield isGitRepoDir(targetPath);

  if (!isGitDir) {
    logger.error(`Invalid path: ${targetPath.green}, please make sure that is a git repository`);
    return yield Promise.reject();
  }

  let gitConfig = yield parseGitConfigAsync({
    cwd: targetPath,
    path: path.join('.git', 'config')
  });

  const origin = gitConfig[`remote "origin"`] || {};

  if (!origin.url) {
    logger.error(`Invalid repository, please make sure that you have set remote repository url`);
    return yield Promise.reject();
  }

  const gitInfo = gitUrlParse(origin.url);

  const configJSON = yield fs.readJsonAsync(config.paths.config);

  const distPath = path.join(process.env.HOME, configJSON.base, gitInfo.source, gitInfo.owner, gitInfo.name);

  if (yield isExistPath(distPath)) {
    let isConfirmReplace = {result: false};
    if (options.force) {
      isConfirmReplace = {result: true};
    } else {
      isConfirmReplace = yield prompt({
        type: 'confirm',
        name: 'result',
        message: `repository has exist, Are you sure to replace ${distPath.yellow}`.white,
        "default": false,
      });
    }

    if (!isConfirmReplace.result) {
      logger.info('ok! Good bye.');
      return Promise.reject();
    } else {
      // if it's a link, then unlink first
      if (yield isLink(distPath)) yield fs.unlinkAsync(distPath);
      yield fs.removeAsync(distPath);
    }
  }

  let action = '';

  if (options.hard) {
    action = 'move';
    yield fs.moveAsync(targetPath, distPath);
  } else {
    action = 'link';
    // make sure his parent dir has exist
    yield fs.ensureDirAsync(path.resolve(distPath, '../'));
    // specify dir only for window, other platform will ignore
    yield fs.symlinkAsync(targetPath, distPath, 'dir');
  }

  const lockJSON = yield fs.readJsonAsync(config.paths.lock);
  lockJSON.repos = lockJSON.repos || [];

  lockJSON.repos.push(_.extend({}, gitInfo, {path: distPath}));

  yield fs.writeJsonAsync(config.paths.lock, lockJSON);

  logger.info(`${targetPath.green} has been ${action} to ${distPath.yellow}`);

  return yield Promise.resolve();
}

function *importHandler(targetPath, options) {
  if (options.all) {
    const files = yield fs.readdirAsync(targetPath);
    while (files.length) {
      let file = files.shift();
      yield co(function *() {
        return yield importHandlerOneDir(path.join(targetPath, file), options);
      }).catch(function (err) {
        if (err) {
          console.error(err);
        }
        return Promise.resolve();
      });
    }
  } else {
    yield importHandlerOneDir(targetPath, options);
  }
}

module.exports = function (path, options) {
  return importHandler(path, options);
};