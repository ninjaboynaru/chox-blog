const keystone = require('keystone');

const ProjectCategory = new keystone.List('ProjectCategory', {
	autokey: { from: 'name', path: 'key', unique: true },
	defaultSort: '-displayPriority',
});

ProjectCategory.add({
	name: { type: String, required: true },
	displayPriority: { type: String, default: 0, initial: true },
});

ProjectCategory.relationship({ ref: 'Project', path: 'projects', refPath: 'category' });

ProjectCategory.defaultColumns = 'name displayPriority';
ProjectCategory.register();
