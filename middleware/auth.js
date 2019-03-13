const apiUrl = process.env.API_URL;
const rp = require('request-promise');


const fetchUserData = (req, res, next) => {
  const demoUser = {
    email: 'demo@demo.nl',
    firstName: 'Tosh',
    lastName: 'Koevoets',
    role: 'admin'
  };

  req.user = demoUser
  res.locals.user = demoUser;
  next();

  /*
  rp({
    method: 'POST',
    uri: `${apiUrl}/api/user/me`
  })
  .then((user) => {
    req.user = user;
    res.locals.user = user;
    next();
  })
  .catch((e) => {
    console.log('===> e', e);
    res.redirect('/');
  });
  */
}

const ensureRights = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
///  if (req.isAuthenticated) {
    next();
  } else {
    res.status(500).json({ error: 'Huidige account heeft geen rechten' });
  }
}

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated) {
    next();
  } else {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const redirectUrl = `${apiUrl}/oauth/login?redirectUrl=${fullUrl}`;
//    console.log('===>', redirectUrl);
    res.redirect(redirectUrl);
  }
};

const check = (req, res, next) => {
  const jwt = req.query.jwt;

  if (req.query.jwt) {
    req.session.jwt = req.query.jwt;
    req.isAuthenticated = true;
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const redirectUrl = `${apiUrl}/oauth/login?redirectUrl=${fullUrl}`;
    req.session.save(() => {
      console.log('saved');
      // redirect to remove JWT from url, otherwise browser history will save JWT, allowing people to login.
      res.redirect('/');
      return;
    })

  } else {
    console.log('req.session.jwt', req.session.jwt);

    /**
     * Add user call to make sure it's an active JWT.
     */
    req.isAuthenticated = !!req.session.jwt;
    next();
  }
};


exports.check = check;
exports.fetchUserData = fetchUserData;
exports.ensureAuthenticated = ensureAuthenticated;
exports.ensureRights = ensureRights;
