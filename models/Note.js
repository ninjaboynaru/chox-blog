var keystone = require('keystone');
var Types = keystone.Field.Types;


var Note = new keystone.List('Note', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
});

Note.add({
	title: { type: String, required: true },
	publishedDate: { type: Types.Date, index: true, required: true, initial: true },
	grouping: { type: String, index: true },
	content: {
		body: { type: Types.Html, wysiwyg: true, height: 400 },
	},
	category: { type: Types.Relationship, ref: 'NoteCategory', required: true, initial: true, many: false, index: true },
	subcategory: { type: Types.Relationship, ref: 'NoteSubcategory', required: true, initial: true, many: false },
});

// ensure that the selected subcategory actually belongs to the selected category
Note.schema.path('subcategory').validate(function (value, callback) {
	keystone.list('NoteSubcategory').model.find({ _id: value }).exec(function (error, result) {
		if (error) {
			throw error;
		}
		else if (result.length === 0) {
			callback(false);
		}
		else if (result[0].parent.equals(this.category) === false) {
			callback(false);
		}
		else {
			callback(true);
		}
	}.bind(this));
}, 'The specified subcategory field does not belong to the specified category field (or an error has occured)');

Note.defaultColumns = 'title, category|20%, subcategory|20%, publishedDate|20%';
Note.register();
