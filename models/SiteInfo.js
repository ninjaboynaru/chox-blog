const keystone = require('keystone');
const Types = keystone.Field.Types;

const SiteInfo = new keystone.List('SiteInfo');

SiteInfo.add({
	city: { type: String, required: true, initial: true },
	state: { type: String, required: true, initial: true },
	contact: {
		phone: { type: String, required: true, initial: true },
		email: { type: Types.Email, required: true, initial: true },
	},
	links: {
		github: { type: Types.Url, required: true, initial: true },
		linkedin: { type: Types.Url, required: true, initial: true },
		portfolio: { type: Types.Url, required: true, initial: true },
	},
	text: {
		intro: {
			title: { type: Types.Html },
			body: { type: Types.Html },
		},
		about: { type: Types.Html },
		footer: { type: Types.Html },
	},
	siteTitle: { type: String, required: true, initial: true },
	headshotUrl: { type: Types.Url, required: true, initial: true }
});

SiteInfo.register();
