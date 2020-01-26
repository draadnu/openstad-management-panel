const userMw = require('../middleware/user');
const clientMw = require('../middleware/userClient');
const roleMw = require('../middleware/role');
const userApiService = require('../services/userApi');
const apiUrl = process.env.USER_API;


module.exports = function(app){
  /**
   * Overview of users
   */
  app.get('/admin/users',
  //  userMw.withAll,
    (req, res) => {
      res.render('users/overview.html', {
        apiUrl: `/admin/api/users`
      });
    }
  );

  /**
   * "Proxy" api so AJAX works
   */
  app.get('/admin/api/users',
    userMw.withAll,
    (req, res) => { res.json(req.users); }
  );

  /**
   * Show new user form
   */
  app.get('/admin/user',
    clientMw.withAll,
    roleMw.withAll,
    (req, res) => {
      res.render('users/form.html');
    }
  );

  /**
   * Render edit form
   */
  app.get('/admin/user/:userId',
    clientMw.withAll,
    roleMw.withAll,
    userMw.withOne,
    (req, res) => {
      const userRoles = req.editUser.roles;

      // iteriate through every client to add which role the user 
      const userApiClients = req.userApiClients.map((client) => {
        client.userRole =  userRoles ? userRoles.find(userRole => userRole.clientId === client.id) : {};
        return client;
      });

      res.render('users/form.html', {
        userApiClients: userApiClients
      });
    }
  );

  /**
  * "Proxy" api so AJAX works in the overview datatables
   */
  app.post('/admin/user',
    (req, res) => {
      userApiService
        .create(req.body)
        .then((response) => {
          req.flash('success', { msg: 'Created user!' });
          res.redirect('/admin/users');
        })
        .catch((err) => {
          let message = err && err.error && err.error.message ?  'Er gaat iets mis: '+ err.error.message : 'Er gaat iets mis!';
          req.flash('error', { msg: message });
          res.redirect('/admin/user');
        })
    }
  );

  /**
   * Handle post for editing user
   */
  app.post('/admin/user/:userId',
    clientMw.withAll,
    roleMw.withAll,
    (req, res) => {
      userApiService
        .update(req.params.userId, req.body)
        .then((response) => {
          req.flash('success', { msg: 'Updated user!' });
          res.redirect('/admin/user/' + req.params.userId);
        })
        .catch((err) => {
          let message = err && err.error && err.error.message ?  'Er gaat iets mis: '+ err.error.message : 'Er gaat iets mis!';
          req.flash('error', { msg: message });
          res.redirect('/admin/user/' + req.params.userId);
        })
    }
  );

  /**
   * Handle deleting user
   */
  app.post('/admin/user/:userId/delete',
    (req, res) => {
      userApiService
        .delete(req.params.userId)
        .then((response) => {
          req.flash('success', { msg: 'Deleted user!' });
          res.redirect('/admin/users');
        })
        .catch((err) => {
          let message = err && err.error && err.error.message ?  'Er gaat iets mis: '+ err.error.message : 'Er gaat iets mis!';
          req.flash('error', { msg: message });
          res.redirect('/admin/users');
        })
    }
  );
}
