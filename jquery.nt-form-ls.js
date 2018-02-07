(function( $, undefined ) {
$.widget( "ui.ntformls", {
	options: {
		tablename: '',    
		table: {},
		divId: '',
		database: null,
		columns:[],
		record: {},
		primeOnInsert: function(){},
		primeOnCopy: function(){},
		primeOnChange: function(){}
	},	

//------------------------------------------------------
	_init: function() {		
		for (j in database.tables){
			if(database.tables[j].name == this.options.tablename){
				this.options.table = database.tables[j];
				$.extend(this.options.record,this.options.table.record);
				break;
			}
		}	
	},	
//------------------------------------------------------
	start: function() {
	},	
//------------------------------------------------------
	stop: function() {
	},	
//------------------------------------------------------
	clearForm: function(elem) {
		$(elem).find('input').not('button, submit, reset, hidden, checkbox, radio').val('');
		$(elem).find('[type=checkbox]').attr('checked', false);	
		$(elem).find('[type=radio]').attr('checked', false);	
	},	
//------------------------------------------------------
	populate: function(action,guid) {
		var _this = this;
		var id = this.options.divId;		
		switch (action){
		case 1: //insert		
			this.clearForm(id);
			this.options.primeOnInsert();
			$(id).ntform('show');	
			break
		case 2: //change
		case 4: //copy			
			if (!guid){
				console.log('populating form, but no guid set')
			} else {
				idbGet(this.options.database,this.options.table,guid,function(record){
						//oncomplete
						_this.options.record = record;
						ntd.setRow(record.guid); // guid might be changed by the idbGet from _first_ etc.
						$(id).ntformls( "populateRecord",_this.options.record)
						if (action==4){
							_this.options.record[_this.options.table.primarykeyfield] = ''; // clear guid, so Write does an Insert
						}
						$(id).ntform('show');	
					}, function(){
						//not found
					}, function(){
						//on error
					});
			}	
		}	
	},	
//------------------------------------------------------
	populateRecord: function(record) { // move fields from record to form fields
		var typ='';
		for (var i in this.options.columns){
			for (var j in record){
				if (j == this.options.columns[i].field){
					//
					typ = $(this.options.columns[i].id).attr('type');
					switch(typ){
						case 'checkbox':
							if(record[j]==$(this.options.columns[i].id).attr('value')){
								$(this.options.columns[i].id).attr('checked','checked')
							}	
							break
						default:
							$(this.options.columns[i].id).val(record[j])
					}	
					break;
				}
			}
		}
	},
//------------------------------------------------------
	save: function(action,browseid,guid) { // move fields from form fields to table
		this.options.record.guid = guid;
		var elem;
		for (var i in this.options.columns){
			for (var j in this.options.record){
				if (j == this.options.columns[i].field){
					elem = $(this.options.columns[i].id);
					this.options.record[j] = getFormFieldValue(elem,this.options.record[j]) // might return same value if field not found.
					
					break;
				}
			}
		}	
		idbWrite(this.options.database,this.options.table,this.options.record,false,function(uid){ // oncomplete gets the guid of the saved record
			switch (action){
			case 1: //insert		
			case 4: //copy			
				$(browseid).ntbrowsels("populate",undefined,uid)
				break;
			case 3: //delete
				$(browseid).ntbrowsels("populate")
				break;
			case 2: //change
				$(browseid).ntbrowsels("repopulateRow",uid)
				break;
			}
		})	
	}
//------------------------------------------------------
});

$.extend( $.ui.ntformls, {
	version: "@VERSION"
});

})( jQuery );

