const reftab = require('./lib/reftab');

const api = new reftab({
    publicKey: process.env.REFTAB_PUBLIC_KEY,
    secretKey: process.env.REFTAB_SECRET_KEY
});

exports.get = async function(keyword)
{
    let assets = await api.get("search?q=" + keyword + "&limiter=keyword").catch((err) => {
        console.log(err);
        return null;
    });
    let asset = assets['assets']
    if(asset.length > 0)
    {   
        asset[0]['details'] = JSON.parse(asset[0]['details'])
        return asset[0]
    }
    return null;
}

exports.update_serialnumber = async function(rid, new_sn, model, purchasing)
{
    asset = await api.get('assets', rid);

    asset['details']['Serial Number'] = new_sn;
    asset['details']['Model'] = model;
    asset['details']['Purchasing Department'] = purchasing;

    let response = await api.put('assets', asset['aid'], asset);

    if (response['aid'])
    {
        return response;
    }
    else
    {
        return null;
    }
}

exports.update_asset_name = async function(rid, name, model, purchasing)
{
    asset = await api.get('assets', rid);

    asset['title'] = name;
    asset['details']['Model'] = model;
    asset['details']['Purchasing Department'] = purchasing;

    let response = await api.put('assets', asset['aid'], asset);

    if(response['aid'])
    {
        return response;
    }
    else
    {
        return null;
    }
}

exports.update_loanee = async function(rid, email)
{
    let user = await this.getUsers(email, 1);

    let loan = await api.post('loans', {
        aids: [rid],
        due: "",
        lnid: user[0]['lnid'],
        loan_uid: user[0]['uid']
    });

    if(loan[0]['aid'])
    {
        return loan;
    }
    else
    {
        return loan[0]["error"];
    }
}

exports.checkInAsset = async function(rid)
{

    lid = await api.get('loans?aid=' + rid);

    lid = lid[0]["lid"];

    loan = await api.put('loans', lid, {
        status: "in"
    });
}

exports.getUsers = async function(query, limit)
{
    let users = await api.get('loanees?q=' + query + '&limit=' + limit);

    return users;
}