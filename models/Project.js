const keystone = require('keystone');
const Types = keystone.Field.Types;

const Project = new keystone.List('Project', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
	defaultSort: '-displayPriority',
});

Project.add({
	title: { type: String, required: true },
	body: { type: Types.Markdown },
	image: { type: Types.Url },
	links: {
		demo: { type: Types.Url },
		github: { type: Types.Url },
	},
	iconNames: { type: Types.TextArray },
	category: { type: Types.Relationship, ref: 'ProjectCategory', many: false },
	displayPriority: { type: Number, default: 0, initial: true },
});

Project.defaultColumns = 'title displayPriority category';
Project.register();
