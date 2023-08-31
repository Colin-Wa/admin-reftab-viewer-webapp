let admin_client = new Map();

exports.set = function (key, val) {
    admin_client.set(key, val);
};

exports.get = function (key) {
    return admin_client.get(key);
};