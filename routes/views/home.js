var keystone = require('keystone');

exports = module.exports = function (req, res) {
	const view = new keystone.View(req, res);
	view.render('index');
};
