const keystone = require('keystone');
const Types = keystone.Field.Types;


const NoteCategory = new keystone.List('NoteCategory', {
	autokey: { from:'name', path:'key', unique:true }
});

NoteCategory.add({
	name: { type:String, required:true, unique:true }
});

NoteCategory.relationship({ ref:'Note', path:'notes', refPath:'category'});
NoteCategory.relationship({
	ref:'NoteSubcategory',
	path:'subcategories',
	refPath:'parent'
});
NoteCategory.register();
