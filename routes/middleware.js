/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
const keystone = require('keystone');


/**
* Initialises the standard view locals
*/
exports.initLocals = function (req, res, next) {
	res.locals.navLinks = [
		{ label: 'About', key: 'home', href: '/' },
		{ label: 'Blog', key: 'blog', href: '/blog' },
		{ label: 'Notes', key: 'notes', href: '/notes' },
		{ label: 'Portfolio', key: 'projects', href: '/projects' },
	];
	res.locals.user = req.user;
	next();
};

/**
* Return a middleware function that sets the "locals.section" variable
*/
exports.initSection = function (section) {
	return function (req, res, next) {
		// locals.section is used to set the currently selected item in the header nav
		res.locals.section = section;
		next();
	};
};

/**
* Initialises SiteInfo locals from the database
*/
exports.initForeignLocals = function (req, res, next) {
	keystone.list('SiteInfo').model.findOne().lean().then(function (siteInfo) {
		if (siteInfo == null) {
			next();
			return;
		}

		res.locals.siteInfo = siteInfo;
		res.locals.links = [];

		const addLink = (label, href, icon) => res.locals.links.push({ label, href, icon });
		addLink('GitHub', siteInfo.links.github, 'github');
		addLink('LinkedIn', siteInfo.links.linkedin, 'linkedin');
		addLink('Portfolio', siteInfo.links.portfolio, 'code');
		addLink('Email', `mailto:${siteInfo.contact.email}`, 'mail');

		res.locals.ogTags = siteInfo.ogTags;

		next();
	}).catch(function (error) {
		next(error);
	});
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) { return msgs.length; }) ? flashMessages : false;
	next();
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
};
