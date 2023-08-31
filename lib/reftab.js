'use strict';

/**
 * Module dependencies
 */

const fetch = require('node-fetch');
const crypto = require('crypto');


function Reftab(options) {

  const url = 'https://www.reftab.com/api/';
  const publicKey = options.publicKey;
  const secretKey = options.secretKey;

  const signRequest = function(request) {
    const body = request.body;
    const method = request.method;
    const now = new Date().toUTCString();
    let contentMD5 = '';
    let contentType = '';
    if (body !== undefined) {
      contentMD5 = crypto.createHash('md5').update(body).digest("hex");
      contentType = 'application/json';
    }
    let signatureToSign = method + '\n' +
      contentMD5 + '\n' +
      contentType + '\n' +
      now + '\n' +
      request.url;
    signatureToSign = unescape(encodeURIComponent(signatureToSign));
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(signatureToSign);
    const token = Buffer.from(hmac.digest('hex')).toString('base64');
    const signature = 'RT ' + publicKey + ':' + token;
    request.headers = {};
    request.headers.Authorization = signature;
    request.headers['x-rt-date'] = now;
    return request;
  };

  this.request = function(method, endpoint, id, body) {
    let path = url + endpoint;
    let statusCode;
    if (id) {
      path += '/' + id;
    }
    return fetch(path, signRequest({
      method: method,
      url: path,
      body: JSON.stringify(body)
    })).then(function(res) {
      statusCode = res.status;
      try {
        const json = res.json();
        return json;
      } catch(err) {
        throw {error: 'Could not read json from server'};
      }
    }).then(function(json) {
      if (200 <= statusCode && statusCode < 400) {
        return json;
      } else {
        throw json;
      }
    });
  };

  this.get = function(endpoint, id) {
    return this.request('GET', endpoint, id);
  };

  this.put = function(endpoint, id, body) {
    return this.request('PUT', endpoint, id, body);
  };

  this.post = function(endpoint, body) {
    return this.request('POST', endpoint, undefined, body);
  };

  this.delete = function(endpoint, id) {
    return this.request('DELETE', endpoint, id);
  };

  return this;
}

module.exports = Reftab;