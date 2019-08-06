const path = require('path');
const fs = require('fs-extra');
const nodemailer = require('nodemailer');
const assert = require('assert');
require('dotenv').config();

// const config = require('../../config.json');

if (!!process.env.SSO_ONLY) {
  assert(process.env.SSO_TOKEN_KEY, 'sso only mode: SSO_TOKEN_KEY should be provided');
  assert(process.env.SSO_AUTH_SERVER_URL, 'sso only mode: SSO_AUTH_SERVER_URL should be provided');
  assert(process.env.SSO_AUTH_USER_URL, 'sso only mode: SSO_AUTH_USER_URL should be provided');
  assert(process.env.SSO_AUTH_SERVER_LOGOUT_URL, 'sso only mode: SSO_AUTH_SERVER_LOGOUT_URL should be provided');
}

const config = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8080,
  adminAccount: process.env.ADMIN_EMAIL,
  db: {
    servername: process.env.DB_HOST || '127.0.0.1',
    DATABASE: process.env.DB_NAME || 'yapi',
    port: process.env.DB_PORT || 27017,
    user: process.env.DB_USER || "",
    pass: process.env.DB_PASS || "",
    authSource: process.env.DB_AUTH_SOURCE || "",
  },
  sso: {
    only: !!process.env.SSO_ONLY,
    token_key: process.env.SSO_TOKEN_KEY || 'ticket',
    server_url: process.env.SSO_AUTH_SERVER_URL,
    user_url: process.env.SSO_AUTH_USER_URL,
    server_logout_url: process.env.SSO_AUTH_SERVER_LOGOUT_URL,
  },
};

let insts = new Map();
let mail;

const WEBROOT = path.resolve(__dirname, '..'); //路径
const WEBROOT_SERVER = __dirname;
const WEBROOT_RUNTIME = path.resolve(__dirname, '../..');
const WEBROOT_LOG = path.join(WEBROOT_RUNTIME, 'log');
const WEBCONFIG = config;

fs.ensureDirSync(WEBROOT_LOG);

if (WEBCONFIG.mail && WEBCONFIG.mail.enable) {
  mail = nodemailer.createTransport(WEBCONFIG.mail);
}

/**
 * 获取一个model实例，如果不存在则创建一个新的返回
 * @param {*} m class
 * @example
 * yapi.getInst(groupModel, arg1, arg2)
 */
function getInst(m, ...args) {
  if (!insts.get(m)) {
    insts.set(m, new m(args));
  }
  return insts.get(m);
}

function delInst(m) {
  try {
    insts.delete(m);
  } catch (err) {
    console.error(err); // eslint-disable-line
  }
}


let r = {
  fs: fs,
  path: path,
  WEBROOT: WEBROOT,
  WEBROOT_SERVER: WEBROOT_SERVER,
  WEBROOT_RUNTIME: WEBROOT_RUNTIME,
  WEBROOT_LOG: WEBROOT_LOG,
  WEBCONFIG: WEBCONFIG,
  getInst: getInst,
  delInst: delInst,
  getInsts: insts
};
if (mail) r.mail = mail;
module.exports = r;