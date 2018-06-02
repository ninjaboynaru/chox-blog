const keystone = require('keystone');

exports = module.exports = function (req, res) {

	const view = new keystone.View(req, res);
	const locals = res.locals;

	locals.filters = {
		category: req.params.category, // {string} category slug from the url
	};

	locals.data = {
		projects: [],
		categories: [], // [{object}] all categories
		category: null, // {object} category object from the database that matches the url slug
	};

	// Load all categories
	view.on('init', function (next) {
		keystone.list('ProjectCategory').model.find()
		.lean()
		.sort({ displayPriority: -1, name: 1 })
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
		if (!locals.filters.category) {
			return next();
		}

		for (let category of locals.data.categories) {
			if (category.key === locals.filters.category) {
				locals.data.category = category; ;
				return next();
			}
		}
		next();
	});

	// Load the projects
	view.on('init', function (next) {
		const queryOptions = {};
		const sortOptions = { displayPriority: -1, name: 1 };

		if (locals.filters.category) {
			queryOptions.category = locals.data.category;
		}

		const query = keystone.list('Project').model.find(
			queryOptions,
			null,
			{ sort: sortOptions }
		);

		query.exec(function (err, results) {
			locals.data.projects = results;

			// Generic "content" property to be used by certain partials
			locals.data.content = locals.data.projects;

			next(err);
		});
	});

	view.render('projects/projects');
};
