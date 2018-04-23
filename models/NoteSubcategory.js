const keystone = require('keystone');
const Types = keystone.Field.Types;


const NoteCategory = new keystone.List('NoteSubcategory', {
	autokey: { from:'name', path:'key', unique:true }
});

NoteCategory.add({
	name: { type:String, required:true, unique:true },
	parent: {
		type:Types.Relationship,
		ref:'NoteCategory',
		many: false,
		required:true,
		initial:true
	}
});

NoteCategory.relationship({ ref:'Note', path:'Notes', refPath:'subcategory'});
NoteCategory.register();
