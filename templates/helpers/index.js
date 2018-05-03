var moment = require('moment');
var _ = require('lodash');
var hbs = require('handlebars');
var keystone = require('keystone');
var cloudinary = require('cloudinary');

// Collection of templates to interpolate
var linkTemplate = _.template('<a href="<%= url %>"><%= text %></a>');
var scriptTemplate = _.template('<script src="<%= src %>"></script>');
var cssLinkTemplate = _.template('<link href="<%= href %>" rel="stylesheet">');

module.exports = function () {

	var _helpers = {};

	/**
	* Generic HBS Helpers
	* ===================
	*/

	// standard hbs equality check, pass in two values from template
	// {{#ifeq keyToCheck data.myKey}} [requires an else blockin template regardless]
	_helpers.ifeq = function (a, b, options) {
		if (a == b) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	// ### Date Helper
	// A port of the Ghost Date formatter similar to the keystonejs - pug interface
	//
	//
	// *Usage example:*
	// `{{date format='MM YYYY}}`
	// `{{date publishedDate format='MM YYYY'`
	//
	// Returns a string formatted date
	// By default if no date passed into helper than then a current-timestamp is used
	//
	// Options is the formatting and context check this.publishedDate
	// If it exists then it is formated, otherwise current timestamp returned

	_helpers.date = function (context, options) {
		if (!options && context.hasOwnProperty('hash')) {
			options = context;
			context = undefined;

			if (this.publishedDate) {
				context = this.publishedDate;
			}
		}

		// ensure that context is undefined, not null, as that can cause errors
		context = context === null ? undefined : context;

		var f = options.hash.format || 'MMM Do, YYYY';
		var timeago = options.hash.timeago;
		var date;

		// if context is undefined and given to moment then current timestamp is given
		// nice if you just want the current year to define in a tmpl
		if (timeago) {
			date = moment(context).fromNow();
		} else {
			date = moment(context).format(f);
		}
		return date;
	};


	/**
	* Returns an html-string of the Categories on a content type.
	* By default, categories are separated by commas.
	* Does not support subcategories.
	*
	* @param {object[]} categories - Array of Category objects
	*
	* USAGE EXAMPLE
	* `{{categoryList categories separator=' - ' prefix='Posted under '}}`
	*/
	_helpers.categoryList = function (section, categories, options) {
		const autolink = _.isString(options.hash.autolink) && options.hash.autolink === 'false' ? false : true;
		const separator = _.isString(options.hash.separator) ? options.hash.separator : ', ';
		const prefix = _.isString(options.hash.prefix) ? options.hash.prefix : '';
		const suffix = _.isString(options.hash.suffix) ? options.hash.suffix : '';

		let output = '';
		if (!categories || !categories.length) {
			return output;
		}

		const categoryNames = _.map(categories, 'name');
		let categoriesHTML;

		if (autolink) {
			// Create HTML as anchor tags
			categoriesHTML = _.map(categories, function (category) {
				return linkTemplate({
					url: _helpers.categoryUrl(section, category.key),
					text: _.escape(category.name),
				});
			}).join(separator);
		}
		else {
			// Create HTML as plain text
			categoriesHTML = _.escape(categoryNames.join(separator));
		}

		output = prefix + categoriesHTML + suffix;
		return new hbs.SafeString(output);
	};

	/**
	* Returns an html string of the Category and Subcategory on a content type.
	* By default, category and subcategory are separated by a comma.
	* Does not support plain text output (output will contain <a> tags)
	*
	* @param {object} category - Category object
	* @param {object} subcategory - Subcategory object
	*
	* USAGE EXAMPLE
	* `{{catSubcatList 'Math' 'Algebra' separator=' - ' prefix='Written under '}}`
	*/
	_helpers.catSubcatList = function (section, category, subcategory, options) {
		const separator = _.isString(options.hash.separator) ? options.hash.separator : ', ';
		const prefix = _.isString(options.hash.prefix) ? options.hash.prefix : '';
		const suffix = _.isString(options.hash.suffix) ? options.hash.suffix : '';

		let categoryHtml = '';
		let subcategoryHtml = '';
		let output = '';

		categoryHtml = linkTemplate({
			url: _helpers.categoryUrl(section, category.key),
			text: category.name,
		});
		output += prefix + categoryHtml
		;
		if (subcategory) {
			subcategoryHtml = linkTemplate({
				url: _helpers.categoryUrl(section, category.key, subcategory.key),
				text: subcategory.name,
			});
			output += separator + subcategoryHtml;
		}

		output += suffix;
		return output;

	};

	/**
	* KeystoneJS specific helpers
	* ===========================
	*/

	// block rendering for keystone admin css
	_helpers.isAdminEditorCSS = function (user, options) {
		var output = '';
		if (typeof (user) !== 'undefined' && user.isAdmin) {
			output = cssLinkTemplate({
				href: '/keystone/styles/content/editor.min.css',
			});
		}
		return new hbs.SafeString(output);
	};

	// block rendering for keystone admin js
	_helpers.isAdminEditorJS = function (user, options) {
		var output = '';
		if (typeof (user) !== 'undefined' && user.isAdmin) {
			output = scriptTemplate({
				src: '/keystone/js/content/editor.js',
			});
		}
		return new hbs.SafeString(output);
	};

	// Used to generate the link for the admin edit post button
	_helpers.adminEditableUrl = function (user, options) {
		var rtn = keystone.app.locals.editable(user, {
			list: 'Post',
			id: options,
		});
		return rtn;
	};

	// ### CloudinaryUrl Helper
	// Direct support of the cloudinary.url method from Handlebars (see
	// cloudinary package documentation for more details).
	//
	// *Usage examples:*
	// `{{{cloudinaryUrl image width=640 height=480 crop='fill' gravity='north'}}}`
	// `{{#each images}} {{cloudinaryUrl width=640 height=480}} {{/each}}`
	//
	// Returns an src-string for a cloudinary image

	_helpers.cloudinaryUrl = function (context, options) {

		// if we dont pass in a context and just kwargs
		// then `this` refers to our default scope block and kwargs
		// are stored in context.hash
		if (!options && context.hasOwnProperty('hash')) {
			// strategy is to place context kwargs into options
			options = context;
			// bind our default inherited scope into context
			context = this;
		}

		// safe guard to ensure context is never null
		context = context === null ? undefined : context;

		if ((context) && (context.public_id)) {
			options.hash.secure = keystone.get('cloudinary secure') || false;
			var imageName = context.public_id.concat('.', context.format);
			return cloudinary.url(imageName, options.hash);
		}
		else {
			return null;
		}
	};

	/** Direct url link to a specific post */
	_helpers.postUrl = function (postSlug, options) {
		return `/blog/post/${postSlug}`;
	};
	/** Direct url link to a specific note*/
	_helpers.noteUrl = function (noteSlug, options) {
		return `/notes/note/${noteSlug}`;
	};

	/**
	* Return the URL for a specific content page.
	* Used for pagination urls on blog and other content pages.
	*
	* @param {string} section - The current content section.
	* @param {string} [categoryKey] - Optional
	* @param {string} [subcategoryKey] - Optional
	*/
	_helpers.pageUrl = function (section, pageNumber, categoryKey, subcategoryKey, options) {
		let url = _helpers.categoryUrl(section, categoryKey, subcategoryKey);
		url += `?page=${pageNumber}`;
		return url;
	};

	/**
	* Create the category url for a content page
	*/
	_helpers.categoryUrl = function (section, categoryKey, subcategoryKey, options) {
		let categoryUrl = `/${section}`;
		if (categoryKey) {
			categoryUrl += '/';
			categoryUrl += `${categoryKey}`;

			if (subcategoryKey) {
				categoryUrl += `.${subcategoryKey}`;
			}
		}
		categoryUrl += '/';

		return categoryUrl;
	};

	// ### Pagination Helpers
	// These are helpers used in rendering a pagination system for content
	// Mostly generalized and with a small adjust to `_helper.pageUrl` could be universal for content types

	/*
	* expecting the data.posts context or an object literal that has `previous` and `next` properties
	* ifBlock helpers in hbs - http://stackoverflow.com/questions/8554517/handlerbars-js-using-an-helper-function-in-a-if-statement
	* */
	_helpers.ifHasPagination = function (postContext, options) {
		// if implementor fails to scope properly or has an empty data set
		// better to display else block than throw an exception for undefined
		if (_.isUndefined(postContext)) {
			return options.inverse(this);
		}
		if (postContext.next || postContext.previous) {
			return options.fn(this);
		}
		return options.inverse(this);
	};

	/**
	* Create pagination numbers HTML.
	* Will create inner <li> and <a> elements but not an outer <ul> element to contain them.
	* Will not create the "previous" and "next" HTML elements, only the numbers for pages.
	*
	* @param {string} section - The current section. Used to direct the anchor tags to the
	* correct url. For example, "blog", or "notes".
	*
	* @param {object} content - Object containg paging information as well as an array of
	* Post or Note objects. Can be obtained easily using Keystones' ".paginate()" method
	* on a Post or Note List (Keystone List, not Mongo model)
	*
	* @param {number[]} content.pages - Array of pages
	* @param {number} content.currentPage - The current page
	* @param {number} content.totalPages - Total pages (length of the content.pages param)
	*
	* @param {string} [currentClass] - CSS Class to add to the active/current
	* page (added to the <li> element) (optional)
	*
	* @param {string} [categoryKey] - Key (url slug) for the current category (optional)
	* @param {string} [subcategoryKey]- Key (url slug) for the current subcategory (optional)
	*/
	_helpers.paginationNavigation = function (section, content, currentClass, categoryKey, subcategoryKey) {
		/*
		* content.pages should be an array ex.  [1,2,3,4,5,6,7,8,9,10, '....']
		* '...' will be added by keystone if the pages exceed 10
		*/
		var html = '';

		_.each(content.pages, function (page, index) {
			// create ref to page, so that '...' is displayed as text even though int value is required
			const pageText = page;

			// create boolean flag state if currentPage
			const isCurrentPage = (page === content.currentPage) ? true : false;

			// an active class indicator
			const currentCSS = (isCurrentPage && currentClass) ? `class=${currentClass}` : '';

			// if '...' is sent from keystone then we need to override the url
			if (page === '...') {
				// check position of '...' if 0 then return page 1, otherwise use totalPages
				page = (index) ? content.totalPages : 1;
			}

			// get the pageUrl using the integer value
			var pageUrl = _helpers.pageUrl(section, page, categoryKey, subcategoryKey);

			// wrapup the html
			html += '<li ' + currentCSS + '>' + linkTemplate({ url: pageUrl, text: pageText }) + '</li>\n';
		});
		return html;
	};

	/**
	* Special helper to ensure that we always have a valid page url set even if
	* the link is disabled, will default to page 1
	*/
	_helpers.paginationPreviousUrl = function (section, previousPage, totalPages, categoryKey, subcategoryKey) {
		if (previousPage === false) {
			previousPage = 1;
		}
		return _helpers.pageUrl(section, previousPage, categoryKey, subcategoryKey);
	};

	/**
	* Special helper to ensure that we always have a valid page url set even if
	* the link is disabled, will default to "totalPages"
	*/
	_helpers.paginationNextUrl = function (section, nextPage, totalPages, categoryKey, subcategoryKey) {
		if (nextPage === false) {
			nextPage = totalPages;
		}
		return _helpers.pageUrl(section, nextPage, categoryKey, subcategoryKey);
	};


	/**
	* Create the inside of the category menu.
	* Will create inner <li>, <a>, and <ul> elements but not an outer <ul> element to contain them.
	* Capable of handling subcategories.
	*
	* @param {string} section - The current section of content. Examlpe "blog" or "notes"
	*
	* @param {object} options.hash.categories - An array of Category objects
	* @param {object} options.hash.currentCategory - The current Category object
	* @param {object} [options.hash.currentSubcategory] - The current Subcategory object (optional)
	* @param {string} [options.hash.activeClass] - The CSS class to assign to the active <li> (optional)
	* @param {string} [options.hash.menuCSS] - The CSS class to assign to sub menus (optional)
	*
	* @return {string} - A string containing the HTML for the menu (inside the menu)
	*/
	_helpers.categoryMenu = function (section, options) {
		const categories = _.clone(options.hash.categories);
		// null currentCategory is equivalent to "All categories"
		const currentCategory = options.hash.category || { key: '', name: 'All Categories' };
		const currentSubcategory = options.hash.subcategory;
		const activeCSS = options.hash.activeClass || '';
		const menuCSS = options.hash.menuClass || '';

		let html = '';
		if (_.isArray(categories) === false) {
			return html;
		}

		// add "All Categories" to the categories array
		categories.unshift({
			name: 'All Categories',
			key: '',

		});

		categories.forEach(function (category) {
			const categoryActive = (currentCategory && category.key === currentCategory.key) ? true : false;

			const liClass = (!currentSubcategory && categoryActive) ? activeCSS : '';
			html += `<li class=${liClass}>`;
			html += `<a href=${_helpers.categoryUrl(section, category.key)}>${category.name}</a>`;

			// a ".subcategories" array should be added by "notes" view to each category object"
			if (category.subcategories == null || category.subcategories.length === 0) {
				html += '</li>';
				return;
			}

			html += `<ul class=${menuCSS}>`;
			category.subcategories.forEach(function (subcategory) {
				let innerLiClass = '';
				if (currentSubcategory && currentSubcategory.key === subcategory.key && categoryActive) {
					innerLiClass = activeCSS;
				}

				html += `<li class=${innerLiClass}>`;
				html += `<a href=${_helpers.categoryUrl(section, category.key, subcategory.key)}>`;
				html += `${subcategory.name}</a>`;
				html += '</li>';
			});

			html += '</ul>';
			html += '</li>';
		});

		return html;
	};

	//  ### Flash Message Helper
	//  KeystoneJS supports a message interface for information/errors to be passed from server
	//  to the front-end client and rendered in a html-block.  FlashMessage mirrors the Pug Mixin
	//  for creating the message.  But part of the logic is in the default.layout.  Decision was to
	//  surface more of the interface in the client html rather than abstracting behind a helper.
	//
	//  @messages:[]
	//
	//  *Usage example:*
	//  `{{#if messages.warning}}
	//      <div class="alert alert-warning">
	//          {{{flashMessages messages.warning}}}
	//      </div>
	//   {{/if}}`

	_helpers.flashMessages = function (messages) {
		var output = '';
		for (var i = 0; i < messages.length; i++) {

			if (messages[i].title) {
				output += '<h4>' + messages[i].title + '</h4>';
			}

			if (messages[i].detail) {
				output += '<p>' + messages[i].detail + '</p>';
			}

			if (messages[i].list) {
				output += '<ul>';
				for (var ctr = 0; ctr < messages[i].list.length; ctr++) {
					output += '<li>' + messages[i].list[ctr] + '</li>';
				}
				output += '</ul>';
			}
		}
		return new hbs.SafeString(output);
	};


	//  ### underscoreMethod call + format helper
	//	Calls to the passed in underscore method of the object (Keystone Model)
	//	and returns the result of format()
	//
	//  @obj: The Keystone Model on which to call the underscore method
	//	@undescoremethod: string - name of underscore method to call
	//
	//  *Usage example:*
	//  `{{underscoreFormat enquiry 'enquiryType'}}

	_helpers.underscoreFormat = function (obj, underscoreMethod) {
		return obj._[underscoreMethod].format();
	};

	return _helpers;
};
