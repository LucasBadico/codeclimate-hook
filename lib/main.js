"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const fs_1 = require("fs");
const node_fetch_1 = __importDefault(require("node-fetch"));
const util_1 = __importDefault(require("util"));
const fs_2 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const exec = util_1.default.promisify(child_process_1.exec);
// import { debug, error, setFailed, getInput } from '@actions/core';
// import { exec } from '@actions/exec';
// import { ExecOptions } from '@actions/exec/lib/interfaces';
const debug = console.log;
const error = console.error;
const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${os_1.platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';
const DEFAULT_CODECLIMATE_DEBUG = 'true';
const execComandStdout = (command) => exec(command).then(({ stdout }) => stdout);
function getCommitSHA() {
    return execComandStdout('git rev-parse HEAD');
}
function getBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        const lines = yield execComandStdout('git rev-parse --abbrev-ref HEAD');
        return lines.split('\n')[0];
    });
}
function downloadToFile(url, file, mode = 0o755) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield node_fetch_1.default(url, { timeout: 2 * 60 * 1000 }); // Timeout in 2 minutes.
            const writer = fs_1.createWriteStream(file, { mode });
            response.body.pipe(writer);
            writer.on('close', () => {
                return resolve();
            });
        }
        catch (err) {
            return reject(err);
        }
    }));
}
exports.downloadToFile = downloadToFile;
function prepareEnv() {
    return __awaiter(this, void 0, void 0, function* () {
        const env = process.env;
        const GIT_BRANCH = yield getBranch();
        const GIT_COMMIT_SHA = yield getCommitSHA();
        return Object.assign(Object.assign({}, env), { GIT_BRANCH,
            GIT_COMMIT_SHA });
    });
}
function run(downloadUrl = DOWNLOAD_URL, executable = EXECUTABLE, coverageCommand = DEFAULT_COVERAGE_COMMAND, codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let lastExitCode = 1;
        try {
            debug(`ℹ️ Downloading CC Reporter from ${downloadUrl} ...`);
            if (!fs_2.default.existsSync(EXECUTABLE)) {
                yield downloadToFile(downloadUrl, executable);
                debug('✅ CC Reporter downloaded...');
            }
        }
        catch (err) {
            error(err.message);
            error('🚨 CC Reporter download failed!');
            return reject(err);
        }
        const execOpts = {
            env: yield prepareEnv(),
        };
        try {
            lastExitCode = yield exec(`${executable} before-build`, execOpts).then(() => 0);
            debug('✅ CC Reporter before-build checkin completed...');
        }
        catch (err) {
            error(err);
            error('🚨 CC Reporter before-build checkin failed!');
            return reject(err);
        }
        try {
            lastExitCode = yield exec(coverageCommand, execOpts).then(() => 0);
            if (lastExitCode !== 0) {
                throw new Error(`Coverage run exited with code ${lastExitCode}`);
            }
            debug('✅ Coverage run completed...');
        }
        catch (err) {
            error(err);
            error('🚨 Coverage run failed!');
            return reject(err);
        }
        try {
            const commands = ['after-build', '--exit-code', lastExitCode.toString()];
            if (codeClimateDebug === 'true')
                commands.push('--debug');
            yield exec(`${executable} ${commands.join(' ')}`, execOpts);
            debug('✅ CC Reporter after-build checkin completed!');
            return resolve();
        }
        catch (err) {
            error(err);
            error('🚨 CC Reporter after-build checkin failed!');
            return reject(err);
        }
    }));
}
exports.run = run;
run();