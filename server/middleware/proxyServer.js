const fs = require('fs');
const yapi = require('../yapi.js');
const axios = require('axios');
const FormData = require('form-data');

module.exports = async (ctx, next) => {
  const _method = ctx.method;
  const path = ctx.path;
  // let header = ctx.request.header;

  if (!(_method === 'POST' && path === '/proxy')) {
    return await next();
  }

  let reqParams = {};
  if (ctx.get('content-type').indexOf('multipart/form-data') !== -1) {
    // console.log(ctx.request.body)
    const { fields, files } = ctx.request.body;
    // console.log(fields, files);
    
    const formData = new FormData();

    // fields
    Object.keys(fields).forEach(key => {
      if (key === 'method') {
        reqParams.method = fields[key];
      } else if (key === 'url') {
        reqParams.url = fields[key];
        // reqParams.url = 'https://httpbin.zcorky.com/upload?x=2';
      } else if (key === 'headers') {
        reqParams.headers = JSON.parse(fields[key]);
        delete reqParams.headers['Content-Type'];
      } else {
        formData.append(key, fields[key]);
      }
    });

    // files
    Object.keys(files).forEach(key => {
      const originFile = files[key];
      // console.log('originFile: ', originFile, originFile.name, originFile.type);
      const path = originFile.path;

      formData.append(key, fs.createReadStream(path), {
        filename: originFile.name,
        contentType: originFile.type,
      });
      // formData.append(key, fs.createReadStream(join(__dirname, 'proxyServer.js')));
    });

    reqParams.headers = {
      ...reqParams.headers,
      ...formData.getHeaders(),
    };
    reqParams.data = formData;
  } else {
    reqParams = ctx.request.body;
  }

  const {
    method,
    url,
    headers,
    data,
  } = reqParams;

  console.debug('reqParams:', reqParams);

  const startAt = Date.now();

  let aRes;

  aRes = await axios({
    method,
    url,
    headers,
    data,
    timeout: 10000,
  });


  // const aRes = await axios.get(url);
  
  const resParams = {
    // id: 'y-request-0',
    status: aRes.status,
    statusText: aRes.statusText,
    // @TODO
    header: aRes.headers,
    body: aRes.data,
  };
  
  // console.log('resParams:', resParams);
  const runTime = Date.now() - startAt;

  ctx.status = 200;
  ctx.body = {
    req: reqParams,
    res: resParams,
    runTime,
  };
};
