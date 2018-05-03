var keystone = require('keystone');

exports = module.exports = function (req, res) {

	const view = new keystone.View(req, res);
	const locals = res.locals;

	locals.filters = {
		/** {string} post slug from th url*/
		post: req.params.post,
	};
	locals.data = {
		/** {object} Post object corresponding to the post slug*/
		post: null,
	};

	// Load the current post
	view.on('init', function (next) {

		const query = keystone.list('Post').model.findOne({
			state: 'published',
			slug: locals.filters.post,
		}).populate('author categories');

		query.exec(function (err, result) {
			locals.data.post = result;
			next(err);
		});

	});

	view.render('blog/post');
};
