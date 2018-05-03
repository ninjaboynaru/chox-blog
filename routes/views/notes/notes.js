const keystone = require('keystone');
const async = require('async');

exports = module.exports = function (req, res) {
	const view = new keystone.View(req, res);
	const locals = res.locals;

	// Init locals
	locals.filters = {
		/* category and subcategory here are {string} slugs from the url*/
		category: req.params.category,
		subcategory: req.params.subcategory,
		page: req.query.page || 1,
	};

	locals.data = {
		notes: {},
		categories: [],
		/* category and subcategory here are objects corresponding to the slugs in the url*/
		category: null,
		subcategory: null,
	};

	// Load all categories and subcategories
	view.on('init', function (next) {
		keystone.list('NoteCategory').model.find()
		.lean()
		.sort('name')
		.exec(function (err, results) {
			if (err || results.length === 0) {
				return next(err);
			}

			locals.data.categories = results;

			// Load subcategories
			async.each(locals.data.categories, function (category, finish) {
				keystone.list('NoteSubcategory').model.find({ parent: category._id })
				.lean()
				.sort('name')
				.exec(function (err, subcategories) {
					category.subcategories = subcategories;
					finish(err);
				});
			}, function (asyncError) {
				next(asyncError);
			});
		});
	});

	// Set the current category and subcategory locals
	view.on('init', function (next) {
		if (!locals.filters.category || locals.data.categories.length === 0) {
			return next();
		}

		for (let category of locals.data.categories) {
			if (category.key === locals.filters.category) {
				locals.data.category = category;
				break;
			}
		}

		if (!locals.filters.subcategory || !locals.data.category || locals.data.category.subcategories.length === 0) {
			return next();
		}

		for (let subcategory of locals.data.category.subcategories) {
			if (subcategory.key === locals.filters.subcategory) {
				locals.data.subcategory = subcategory;
				break;
			}
		}

		next();
	});

	// Load Notes and paging info
	view.on('init', function (next) {
		const queryOptions = {};
		if (locals.data.category) {
			queryOptions.category = { $in: [locals.data.category] };
		}
		if (locals.data.subcategory) {
			queryOptions.subcategory = { $in: [locals.data.subcategory] };
		}

		const query = keystone.list('Note').paginate({
			page: locals.filters.page,
			perPage: 10,
			maxPages: 10,
			filters: queryOptions,
		})
		.sort({ publishedDate: -1 })
		.populate('category subcategory');

		/**
		* NOTE: Attempting .paginate() without its' "filters" option will result
		* in .paginate() paginating the entire collection instead of only documents
		* returned by the query.
		* This is true even if additional filters/query operators are specified
		* after .paginate().
		*/

		query.exec(function (err, results) {
			locals.data.notes = results;

			// Generic "content" property to be used by certain partials
			locals.data.content = locals.data.notes;
			next(err);
		});
	});

	view.render('notes/notes');
};
