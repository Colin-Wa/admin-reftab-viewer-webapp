var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');

const authRouter = require('./auth');

const client_share = require('../client_share');
const admin_actions = require('../admin_actions');
const reftab_actions = require('../reftab_actions');


var ensureLoggedIn = ensureLogIn();

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  if (!req.user) { return res.render('home'); }
  admin_actions.ad_authorize(req.user.id).then(() => next());
}, function(req, res, next) {
  res.locals.filter = null;
  res.render('index', { user: req.user });
});

router.get('/asset/:id', ensureLoggedIn, (req, res) => {
  reftab_actions.get(req.params.id).then((reftab_asset) => {
    let keyword = req.params.id;
    if(reftab_asset != null && reftab_asset['details'])
    {
      keyword = reftab_asset['details']['Serial Number'];
    }
    rtname = reftab_asset['title'];
    rtsn = reftab_asset['details']['Serial Number'];
    admin_actions.get(client_share.get(req.user.id), keyword).then((admin_asset) => {

      if(admin_asset != null && (rtname == admin_asset['annotatedAssetId'] || rtsn.toLowerCase() == admin_asset['serialNumber'].toLowerCase()))
      {
        res.send([admin_asset, reftab_asset]);
      }
      else
      {
        admin_actions.get(client_share.get(req.user.id), rtname).then((new_admin_asset) => {
          res.send([new_admin_asset, reftab_asset]);
        })
      }

    })
  }).catch((err) => {
    console.log(err);
    res.send([null,null]);
  });
});

router.get('/getUsers/:query', ensureLoggedIn, (req, res) => {
  let keyword = req.params.query;

  reftab_actions.getUsers(keyword, 5).then((users) => {
    res.send(users);
  }).catch((err) => {
    console.log(err);
    res.send(null);
  });
});

router.post('/changeSN', ensureLoggedIn, (req, res) => {
  let rid = req.body.rid;
  let change_to_this_sn = req.body.serial_number;
  let model = req.body.model;
  let purchasing = req.body.purchasing;
  reftab_actions.update_serialnumber(rid, change_to_this_sn, model, purchasing).then((output) =>
  {
    res.send([null,output]);
  })
  .catch((err) => {
    console.log(err);
    res.send([null,null]);
  });
});

router.post('/changeAN/', ensureLoggedIn, (req, res) => {
  reftab_actions.update_asset_name(req.body.rid, req.body.asset_name, req.body.model, req.body.purchasing).then((rtout) =>
  {
    let keyword = req.body.keyword;
    if(rtout != null && rtout['details'])
    {
      keyword = rtout['details']['Serial Number'];
    }
    admin_actions.update_asset_name(client_share.get(req.user.id), keyword, req.body.asset_name).then((adout) => {
      if(rtout && adout)
      {
        res.send([adout['data'], rtout]);
      }
    }).catch((err) => console.log(err));
  })
  .catch((err) => console.log(err));
});

router.post('/changeLoanee/', ensureLoggedIn, (req, res) => {
  reftab_actions.update_loanee(req.body.rid, req.body.new_loanee).then((output) =>
  {
    reftab_actions.get(req.body.rid).then((output) => {
      res.send(output);
    });
  })
  .catch((err) => res.send(err["error"]));
});

router.post('/checkInAsset/', ensureLoggedIn, (req, res) => {
  reftab_actions.checkInAsset(req.body.rid).then((output) =>
  {
    reftab_actions.get(req.body.rid).then((output) => {
      res.send(output);
    });
  })
  .catch((err) => res.send(err["error"]));
});

module.exports = router;
