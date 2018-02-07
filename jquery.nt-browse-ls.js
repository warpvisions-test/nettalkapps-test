(function( $, undefined ) {
$.widget( "ui.ntbrowsels", {

//------------------------------------------------------
	_init: function() {		
		for (j in database.tables){
			if(database.tables[j].name == this.options.tablename){
				this.options.table = database.tables[j];
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
// orderBy might be a fieldname, array of field names, or column index. If not passed use options.orderby instead.
	populate: function(orderBy,guid) {
		if (orderBy === undefined){
			orderBy = this.options.orderBy
		} else {
			this.options.orderBy = orderBy
		}	
		if ($.isNumeric(orderBy)){
			var colIndex = this.getColumnProperties(orderBy);  			
			orderBy = this.options.columns[colIndex].orderBy;
		}	
		
		var id = this.options.divId;
		idbSelect(this.options.database,this.options.table,orderBy,false,0,0,0,doPopulate); // false: do not include deleted records

		function doPopulate(resultset){ 												//oncomplete
			$(id).ntbrowsels( "populateTable",guid,resultset)
		}
		
	},	
//------------------------------------------------------
	deleteb: function(guid) {	
		var _this=this;
		idbMarkDelete(this.options.database,this.options.table,guid,doRemove)
		
		function doRemove(){ // remove the row from the table.
			$(_this.options.tableId).find('[data-nt-id="'+guid+'"]').remove()
		}
	},
//------------------------------------------------------
	populateTable: function(guid,resultset) {	
		$(this.options.tableId + " > tbody").empty() // removes all the existing rows
		var s = '';
		for (var rowNum in resultset){
			s = s + this.addRow(rowNum,resultset)
		}
		$(this.options.tableId).append(s);		
		$(this.options.divId).ntbrowse("ready",guid);
	},
//------------------------------------------------------
	repopulateRow: function(guid) {	
		var _this=this;		
		idbGet(this.options.database,this.options.table,guid,doReplace,doAdd)
		
		function doReplace(record){ // replace the existing row with the new data
			var resultset =[]
			resultset.push(record); // TOTEST XXXX
			$(_this.options.tableId).find('[data-nt-id="'+guid+'"]').empty().append(_this.buildRow(0,resultset));
		}
		function doAdd(){ // repopulate the whole table to include the new data.
			_this.populate(_this.options.orderBy,guid);
		}	
	},
//------------------------------------------------------
	addRow: function(rowNum,resultset) {		    
		return '<tr data-nt-id="'+resultset[rowNum][this.options.table.primarykeyfield]+'">'	+ 	
				this.buildRow(rowNum,resultset) + 
				'</tr>'				
	},
//------------------------------------------------------
	buildRow: function(rowNum,resultset) {		    
		for (var physColNum=0 ; physColNum < this.options.columns.length ; physColNum++){ // loop through the columns in no specific order
			var s = s + this.addCell(rowNum,physColNum,resultset); 					// physColNum is the column we wish to show next.
		}
		return s;
	},	
//------------------------------------------------------
	addCell: function(rowNum,physColNum,resultset) {	
		var s = '';
		var colIndex = this.getColumnProperties(physColNum);  // want to get the column object currently assigned to this physical column
		var field = this.options.columns[colIndex].field;
		if (field){
			s = '<td><div class="adiv">' + resultset[rowNum][field] + '</div></td>'
		} else {			
			var button = this.options.columns[colIndex].button;
			if (button){
				var buttonIcon = this.options.columns[colIndex].buttonIcon;
				id = Math.random().toString(36).substr(3,4);
				s = '<td><div class="adiv"><button type="button" name="" id="' + id + '"' + 
					'value="" class="nt-' + button + '-button nt-small-button"  title="Click here to ' + button + ' this record"' +
					'data-do="' + button + '">&#160;</button></div></td>' + 
					'<script>$("#'+ id + '").button({icons:{primary:"ui-icon-'+ buttonIcon +'"},text:false});</script>'
			} else {
				s = '<td></td>'
			}
		}		
		return s;
	},	
//------------------------------------------------------
	getColumnProperties: function(i) {	
	  for (var colIndex in this.options.columns){
		if (this.options.columns[colIndex].columnNumber == i){	
			return colIndex;
		}
	  }
	  return;
	},
//------------------------------------------------------
	clientSideSort: function(elem,dataValue,event,dataValueElement) {	
		var th = $(event.target).get(0); // This is the thing clicked
		if (th.nodeName != 'TH'){ 
			th = $(th).closest('th').get(0); // th is the th clicked on
		}
		var sameColumn =  $(th).hasClass('nt-browse-header-selected');
	
		var descending = 0;
		if (dataValue < 0){
			dataValue = -dataValue;
			descending=1;
		}
	
		var rows = $(this.options.tableId).find('tbody tr').toArray().sort(this.sortComparer(dataValue-1))		           		
		if (descending){
			rows = rows.reverse()
		}
		for (var i = 0; i < rows.length; i++){$(this.options.tableId).append(rows[i])} // data part
		// now for the header part
		if (sameColumn){
			if (descending){
				$(dataValueElement).attr('data-value',dataValue)
				$(th).find('.ui-icon-triangle-1-n').removeClass('ui-icon-triangle-1-n').addClass('ui-icon-triangle-1-s')
			} else {
				$(dataValueElement).attr('data-value',0 - dataValue)
				$(th).find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-n')
			}	
		} else {
			var oldTh = $(this.options.tableId).find('.nt-browse-header-selected');			
			$(oldTh).removeClass('nt-browse-header-selected')
				.addClass('nt-browse-header-not-selected')
				.find('.ui-icon-triangle-1-s,.ui-icon-triangle-1-n').eq(0).remove()
			$(oldTh).find('[data-value]').each(function(){
				$(this).attr('data-value',Math.abs($(this).attr('data-value')));	
			})	
				
			$(th).removeClass('nt-browse-header-not-selected')
				.addClass('nt-browse-header-selected')
				.prepend('<span class="nt-icon-left ui-icon ui-icon-triangle-1-n"></span>')
				.find('[data-value]').attr('data-value',0-Math.abs(dataValue));
		}		
	},
//------------------------------------------------------	
	sortComparer: function (index) {
		var _this=this;
		return function(a, b) {			
			var field='';
			var left='';
			var right='';
			//for (var i=0; i <= orderBy.length ; i++){
			//	field = orderBy[i];
				left = _this.getCellValue(a, index);
				right = _this.getCellValue(b, index);
				if (left===undefined) return -1;
				if (right===undefined) return 1;			
				if ($.isNumeric(left) && $.isNumeric(right)){
					if (left-right != 0) {
						return left-right;
					} // else they are equal so cycle to next field in sort order.
				} else { // one of them is a string, so compare as strings
					if (left != right) {				
						return left.localeCompare(right,'de', { sensitivity: 'base' })
					} // else they are equal so cycle to next field in sort order.
				} 
			//} 
			return 0;			
		}	
	},
//------------------------------------------------------		
	getCellValue: function (row, index){ 
		return $(row).children('td').eq(index).find('*:not(:has("*"))').html()
	}	,
//------------------------------------------------------
	clickRow : function(row,ev){ 
	
	}
//------------------------------------------------------		
});

$.extend( $.ui.ntbrowsels, {
	version: "@VERSION"
});

})( jQuery );

