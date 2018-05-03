var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Post Model
 * ==========
 */

var Post = new keystone.List('Post', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
});

Post.add({
	isNote: { type: Types.Boolean },
	title: { type: String, required: true },
	state: {
		type: Types.Select,
		options: 'draft, published, archived',
		default: 'draft',
		required: true,
		initial: true,
		index: true,
	},
	author: { type: Types.Relationship, ref: 'User', index: true, required: true, initial: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
	featured: { type: Types.Boolean, default: false },
	image: { type: Types.CloudinaryImage },
	content: {
		brief: { type: Types.Html, wysiwyg: true, height: 150 },
		extended: { type: Types.Html, wysiwyg: true, height: 400 },
	},
	categories: { type: Types.Relationship, ref: 'PostCategory', many: true, required: true, initial: true },
});

Post.schema.virtual('content.full').get(function () {
	return this.content.extended || this.content.brief;
});
Post.schema.methods.isPublished = function isPublished () {
	return this.state === 'published';
};

Post.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';
Post.register();
