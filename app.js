// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();
const express = require('express');
const isDev = process.env.ENVIRONMENT === 'development';
const Site = require('./models').Site;
const bodyParser = require('body-parser');
const app = express();
const nunjucks = require('nunjucks');

//app.set('views', __dirname + '/templates');

const nunjucksEnv = nunjucks.configure('templates', {
  autoescape: true,
  express: app
});

const copyDb = require('./services/mongo').copyMongoDb;
const dbExists = require('./services/mongo').dbExists;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

const cleanUrl = (url) => {
  return url.replace(['http://', 'https://'], '');
}

app.get('/', (req, res) => {
  console.log('Site', Site);

  Site
    .fetchAll()
    .then(function (resData) {
      const sites = resData.serialize();

      res.render('overview.html', {
        sites: sites
      });
  });
});

app.get('/beheer/site/:siteId', (req, res) => {
  console.log('Site', Site);

  new Site({
    id: req.params.siteId
  })
    .fetch()
    .then(function (site) {
      res.render('site.html', {
        site: site
      });
    });
});

app.get('/beheer/copy/:oldName/:newName', (req, res) => {
  copyDb(req.params.oldName, req.params.newName)
    .then(() => {
      res.status(200).json({ success: 'Copied DB'});
    })
    .catch((e) => {
      res.status(500).json({ error: 'An error occured: ' + e });
    });
});

app.post('/site', (req, res) => {
  const type = req.body.type;
  const stagingUrl = cleanUrl(req.body.stagingUrl);
  const productionUrl = cleanUrl(req.body.productionUrl);
  console.log('---> res 1', req.body);

  dbExists(type)
    .then((exists) => {
      const dbName = exists ? type : 'localhost';
      console.log('---> res 2', stagingUrl);
      const stagingUrlDB = stagingUrl.replace(/\./g, '');
      console.log('---> res stagingUrl', stagingUrlDB);

      /**
       * Create database for stagingUrl
       */
      copyDb(dbName, stagingUrlDB)
        .then((response) => {
          console.log('---> res', response);

          new Site({
            'name': req.body.siteName,
            'productionUrl': productionUrl,
            'stagingUrl': stagingUrl,
            'fromEmail': req.body.fromEmail,
            'fromName': req.body.fromName,
          }).save().then(function (site) {
            res.redirect('http://' + stagingUrl);
          });
        })
        .catch((e) => {
          console.log(e);
          res.status(500).json({ error: 'An error occured copying the DB: ' + e.msg });
        });
    })
    .catch((e) => {
      console.log(e);

      res.status(500).json({ error: 'An error occured checking if the DB exists: ' + e.msg });
    })
});

app.listen(process.env.PORT, function() {
  console.log('Express server listening on port ' + process.env.PORT);
});

module.exports = app;
