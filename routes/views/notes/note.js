var keystone = require('keystone');

exports = module.exports = function (req, res) {
	const view = new keystone.View(req, res);
	const locals = res.locals;

	locals.filters = {
		/** {string} note slug from the url */
		note: req.params.note,
	};
	locals.data = {
		/** {object} Note object corresponding to the note slug*/
		note: null,
	};

	// Load the current Note
	view.on('init', function (next) {
		const query = keystone.list('Note').model.findOne({
			slug: locals.filters.note,
		}).populate('category subcategory');

		query.exec(function (err, result) {
			locals.data.note = result;
			next(err);
		});

	});

	view.render('notes/note');
};
