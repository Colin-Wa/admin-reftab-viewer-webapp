const path = require('path');
const process = require('process');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const fs = require('fs').promises;

const client_share = require("./client_share")

exports.ad_authorize = async function(user_id) {
    let token_path_for_user = path.join(process.cwd(), '/user_tokens/' + user_id + '_token.json');
    let client = await ad_loadSavedCredentialsIfExist(token_path_for_user);
    if (client) {
        client_share.set(user_id, client);
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await ad_saveCredentials(token_path_for_user,client);
    }

    client_share.set(user_id, client);

    return client;
}

async function ad_loadSavedCredentialsIfExist(token_path) {
    try {
      const content = await fs.readFile(token_path);
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
}

async function ad_saveCredentials(token_path, client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(token_path, payload);
}

exports.get = async function (auth, keyword)
{
    const service = google.admin({version: 'directory_v1', auth});
    res = await service.chromeosdevices.list({
        customerId: process.env.ADMIN_CLIENT_ID,
        maxResults: 1,
        query: keyword
    });
    if(res.data.chromeosdevices)
    {
        return res.data.chromeosdevices[0];
    }
    return null;
}

exports.update_asset_name = async function (auth, keyword, name)
{
    const service = google.admin({version: 'directory_v1', auth});

    let asset = await this.get(auth, keyword)
    
    asset['annotatedAssetId'] = name;

    let updated_asset = await service.chromeosdevices.update({
        customerId: 'my_customer',
        deviceId: asset['deviceId'],
        requestBody: asset
    });

    if(updated_asset['status'])
    {
        return updated_asset;
    }
    else {
        return null;
    }
}