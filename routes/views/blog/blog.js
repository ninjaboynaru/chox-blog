const keystone = require('keystone');

exports = module.exports = function (req, res) {

	const view = new keystone.View(req, res);
	const locals = res.locals;

	locals.filters = {
		/** {string} category slug from the url*/
		category: req.params.category,
		page: req.query.page || 1,
	};
	locals.data = {
		posts: {},
		categories: [],
		/** {object} Category object corresponding to the current category slug*/
		category: null,
	};

	// Load all categories
	view.on('init', function (next) {
		keystone.list('PostCategory').model.find()
		.lean()
		.sort('name')
		.exec(function (err, results) {
			if (err || results.length === 0) {
				return next(err);
			}

			locals.data.categories = results;
			next();
		});
	});

	// Set the current category local
	view.on('init', function (next) {
		if (!locals.filters.category || locals.data.categories.length === 0) {
			return next();
		}

		for (let category of locals.data.categories) {
			if (category.key === locals.filters.category) {
				locals.data.category = category;
				return next();
			}
		}
		next();
	});

	// Load the posts
	view.on('init', function (next) {
		const queryOptions = {};
		queryOptions.state = 'published';

		if (locals.filters.category) {
			queryOptions.categories = { $in: [locals.data.category] };
		}

		const query = keystone.list('Post').paginate({
			page: locals.filters.page,
			perPage: 10,
			maxPages: 10,
			filters: queryOptions,
		})
		.sort({ publishedDate: -1 })
		.populate('author categories');

		/**
		* NOTE: Attempting .paginate() without its' "filters" option will result
		* in .paginate() paginating the entire collection instead of only documents
		* returned by the query.
		* This is true even if additional filters/query operators are specified
		* after .paginate().
		*/

		query.exec(function (err, results) {
			locals.data.posts = results;

			// Generic "content" property to be used by certain partials
			locals.data.content = locals.data.posts;
			next(err);
		});
	});

	view.render('blog/blog');
};
