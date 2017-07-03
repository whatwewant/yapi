'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.resReturn = function (data, num, errmsg) {
    num = num || 0;
    return {
        errcode: num,
        errmsg: errmsg || 'success',
        data: data
    };
};

var MSGTYPE = {
    'log': 'Log',
    'warn': 'warning',
    'error': 'Error'
};

exports.log = function (msg, type) {
    if (!msg) return;
    type = type || 'log';
    var f = void 0;
    switch (type) {
        case 'log':
            f = console.log;break;
        case 'warn':
            f = console.warn;break;
        case 'error':
            f = console.error;break;
        default:
            f = console.log;break;
    }
    f(type + ':', msg);
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();

    var logfile = _path2.default.join(WEBROOT_LOG, year + '-' + month + '.log');

    if ((typeof msg === 'undefined' ? 'undefined' : (0, _typeof3.default)(msg)) === 'object') {
        if (msg instanceof Error) msg = msg.message;else msg = (0, _stringify2.default)(msg);
    }
    var data = new Date().toLocaleTimeString() + "\t|\t" + type + "\t|\t" + msg;
    _fsExtra2.default.writeFileSync(logfile, data, {
        flag: 'w+'
    });
};

exports.fileExist = function (filePath) {
    try {
        return _fsExtra2.default.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
};