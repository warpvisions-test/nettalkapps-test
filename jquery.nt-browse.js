///////////////////////////////////////////////////////
//
//   jQuery Plugin for NetTalk Browse
//   Part of NetTalk by CapeSoft
//   (c) 2015
//
///////////////////////////////////////////////////////

(function( $, undefined ) {

$.widget( "ui.ntbrowse", {
        options: {
			id: '',               // contains div name (minus the _div part)
			tableId: '',			
			mobile:0,
			randomid: '',
			procedure: '',            // server procedure
			title: '',            // title for dialog
			parent: '',           // parent procedure which is including this browse
			parentrid: '',        // rid of parent procedure if it is a browse
			form: '',             // url of the form procedure
			formInsert: '',
			formCopy: '',
			formChange: '',
			formView: '',
			formDelete: '',
			formpopup: 1,         // is the form procedure opened as a popup?
			popup: 0,             // is the browse on a popup window
			bgOne:'nt-browse-gb1',                  // first color used in greeen-barring
			bgTwo:'nt-browse-gb2',                  // second color used in green-barring
			bgOver:'nt-browse-mouseover',                   // color for row currently under mouse
			bgSelect:'nt-browse-selected',                  // highlight color - shows selected record
			rowsHigh:1,
			column:0,
			highlightSelected:1,
			greenbar:1,
			mouseover:1,
			rowSelected:1,
			resizable:0,
			value: '',
			selectAction: '',
			closeAction: '',
			lookupField: '',
			confirmDelete:1,
			confirmDeleteMessage:'Are you sure you want to delete this record?',
			deleteText:'Delete',
			cancelText:'No',
			confirmText:'Confirm',				
			expand: 'circle-arrow-s',
			contract: 'circle-arrow-n',
			addsec:'',    				// secwin access rights procedure name
			urlExt:'',
			json:0,
			localStorage:0,
			timer:0,
			timerRefresh:''
		},
		state: {
			exportProgress:'',
			exportButton:'',
			blurring:0
		},
		locVal:'',

		//------------------------------------------------------
        _create: function() {
			var _this=this;
			this.options.divId = '#' + this.options.id + '_div';
			$(this.options.divId).addClass("exists");
			//this.options.tableId = '#' + this.options.id + '_tbl';
			if (this.options.urlExt==''){try{this.options.urlExt=ntdExt} catch(e){};}
			this.ready();			
			if (this.options.timer >0){
				this.timerStart(this.options.timer);
			}
        },

		//------------------------------------------------------
        _init: function() {
        },

		//------------------------------------------------------
		ready: function(id) {
			this._prepColumns();
			this._makeResizable();
			this._bindEvents();
			this.refresh(id);
			if (this.options.popup==1){
				try{
					$("#popup_" + this.options.procedure + "_div").dialog("option","title",this.options.title);
				} catch (e) {};	
			}					
        },

		//------------------------------------------------------
        destroy: function() {
			$.Widget.prototype.destroy.apply( this, arguments );
        },

		//------------------------------------------------------
		// called on window unload event
        destructor: function() {
			var parms = '_rid_=' + this.options.randomid + '&_event_=clearbrowse';
//                $.get(this.options.procedure + this.options.urlExt,parms,function(data){}); in page mode, to memory form, from button under browse, this is a problem as it can delete the bidv too early.
			return this;
        },

		//------------------------------------------------------
        _bindEvents : function() {
			var _this = this;
			$(this.element).off('focus.bt','[data-do="lo"]').on('focus.bt','[data-do="lo"]',function(e){_this.locateFocus(this);});
			$(this.element).off('blur.bt','[data-do="lo"]').on('blur.bt','[data-do="lo"]',function(e){_this.locateBlur(this);});
			$(this.element).off('asifBlur.bt','[data-do="lo"]').on('asifBlur.bt','[data-do="lo"]',function(e){_this.locateAsifBlur(this,e);});
			$(this.element).off('change.bt','[data-do="lo"]').on('change.bt','[data-do="lo"]',function(e){_this.locate(this,e);});
			$(this.element).off('input.bt','[data-do="lo"]').on('input.bt','[data-do="lo"]',function(e){_this.locate(this,e);});
			$(this.element).off('keyup.bt','[data-do="lo"]').on('keyup.bt','[data-do="lo"]',function(e){_this.KeyPressLoc(this,e);}); // only for IE8/IE9
			$(this.element).off('valuechanged.bt','[data-do="lo"]').on('valuechanged.bt','[data-do="lo"]',function(e){_this.locateChanged(this);});
			$(this.element).off('change.bt','[data-do="eip"]').on('change.bt','[data-do="eip"]',function(e){_this.eip(this);});
			$(this.element).off('click.bt','[data-do="cv"]').on('click.bt','[data-do="cv"]',function(e){_this.toggleRowStatus(this);});
			$(this.element).off('click.bt','[data-do="bserver"]').on('click.bt','[data-do="bserver"]',function(e){_this.bbutton(this);});
			$(this.element).off('click.bt','[data-do="sh"]').on('click.bt','[data-do="sh"]',function(ev){_this.sort(this,ev);});
			$(this.element).off('click.bt','[data-do="clo"]').on('click.bt','[data-do="clo"]',function(e){_this.clearLocator();});
			$(this.element).off('click.bt','[data-do="insert"]').on('click.bt','[data-do="insert"]',function(e){_this.edit(this,1,'insert');});
			$(this.element).off('click.bt','[data-do="copy"]').on('click.bt','[data-do="copy"]',function(e){_this.edit(this,4,'copy');});
			$(this.element).off('click.bt','[data-do="change"]').on('click.bt','[data-do="change"]',function(e){_this.edit(this,2,'change');});
			$(this.element).off('click.bt','[data-do="view"]').on('click.bt','[data-do="view"]',function(e){_this.edit(this,5,'view');});
			$(this.element).off('click.bt','[data-do="deleteb"]').on('click.bt','[data-do="deleteb"]',function(e){_this.deleteb(this);});
			$(this.element).off('click.bt','[data-do="browsecancel"]').on('click.bt','[data-do="browsecancel"]',function(e){_this.cancel();});
			$(this.element).off('click.bt','[data-do="close"]').on('click.bt','[data-do="close"]',function(e){_this.close();});
			$(this.element).off('click.bt','[data-do="select"]').on('click.bt','[data-do="select"]',function(e){_this.select(this);});
			$(this.element).off('click.bt','[data-do="first"]').on('click.bt','[data-do="first"]',function(e){_this.nav('','first');});
			$(this.element).off('click.bt','[data-do="previous"]').on('click.bt','[data-do="previous"]',function(e){_this.nav('','previous');});
			$(this.element).off('click.bt','[data-do="next"]').on('click.bt','[data-do="next"]',function(e){_this.nav('','next');});
			$(this.element).off('click.bt','[data-do="last"]').on('click.bt','[data-do="last"]',function(e){_this.nav('','last');});
			$(this.element).off('click.bt','[data-do="export"]').on('click.bt','[data-do="export"]',function(e){_this.exportTo('excel',this);});
			return this;
        },

		//------------------------------------------------------
        refresh : function(v) {
			this.setvalue(v);
			this.options.table=document.getElementById(this.options.tableId);
			if (this.options.value){
				this.options.rowSelected = $('[data-nt-id="' + this.options.value + '"]').closest('tr').prevAll().length;
				this.options.rowSelected = parseInt(this.options.rowSelected/this.options.rowsHigh) * this.options.rowsHigh;
			} else {
				this.options.rowSelected = -1
			}	
		
			this._applyGreenBar();
			this._preContractVertically();
			
			var _this = this;			
			if (this.options.table){
				if (this.options.table.nodeName=='TABLE'){
					var tr = ' > tbody > tr'
				} else {
					var tr = ' > div'
				}			
				$('#' + this.options.tableId + tr)
						.off('mouseover.bt mouseout.bt click.bt dblclick.bt')
						.on('mouseover.bt',function(ev){_this._onMouseIn(this,ev);})
						.on('mouseout.bt',function(ev){_this._onMouseOut(this,ev);})
						.on('dblclick.bt',function(ev){_this._onDoubleClick(this,ev);})
						.on('click.bt',function(ev){_this.clickRow(this,ev);});
				$('#' + this.options.tableId + ' input')
					.off('keydown.bt focus.bt')
					.on('keydown.bt',function(e){_this._keydown(this,e);})
					.on('focus.bt',function(e){_this._setColumn(this,e);});
				
				$('#locator1' + _this.options.id + ',' + '#locator2' + _this.options.id)
					.off('keypress.bt')
					.off('keydown.bt')
					.off('keyup.bt')
					//.on('keypress.bt',function(e){return _this._keyPressLoc(this,e);})
					//.on('keyup.bt',function(e){return _this._keyUpLoc(this,e);})
					.on('keydown.bt',function(e){return _this._keyDownPaging(this,e);});
			}	
			return this;
        },

		//------------------------------------------------------
        activeTab: function( newValue ) {
			if ( newValue === undefined ) {
					return this.options.activeTab;
			}
			this._setOption( "activeTab", newValue );
			return this;
        },

		//------------------------------------------------------
        _setOption: function( opt, value ) {
			switch (opt){
			case "bgOver":
					this.options.bgOver = value;
					break;
			case "bgSelect":
					this.options.bgSelect = value;
					break;
			case "bgOne":
					this.options.bgOne = value;
					break;
			case "bgTwo":
					this.options.bgTwo = value;
					break;
			}
			$.Widget.prototype._setOption.apply( this, arguments );
        },

		//------------------------------------------------------
		colorBlock : function(block,what) {  // sets the color of a multi-row block.
			if ((this.options.greenbar == 0) && (this.options.mouseover==0) && (this.options.highlightSelected==0)){
				return 0;
			}

			var _this=this;
			var col=this.options.bgOne;
			var i = parseInt(block*this.options.rowsHigh);
			if (this.options.table.nodeName=='TABLE'){
				if (i > this.options.table.tBodies[0].rows.length){
					return 1;
				}
			} else {
				if (i > $('#' + this.options.tableId).children().length){
					return 1;
				}			
			}

			if (this.options.mouseover==1 && what==1){
					col=this.options.bgOver;
			} else if(this.options.highlightSelected==1 && this.options.rowSelected==i){
					col=this.options.bgSelect;
			} else if (this.options.greenbar==1){
					col=(block%2==0) ?  this.options.bgOne :  this.options.bgTwo;
			}
			if (this.options.table.nodeName=='TABLE'){
				var td = '> tbody > tr'
			} else {
				var td = '> div'
			}			
			$('#' + this.options.tableId + td).
				slice(i,i+_this.options.rowsHigh).each(function(){
						$(this).removeClass(_this.options.bgOne + ' ' + _this.options.bgTwo + ' ' + _this.options.bgOver + ' ' + _this.options.bgSelect).
						addClass(col);
				});
			return 0;
		},

		//------------------------------------------------------
		_colorRow : function(row,what) {  // draws a whole block, based on a row index
			this.colorBlock(parseInt(row / this.options.rowsHigh),what);
		},

		//------------------------------------------------------
		_onMouseIn : function(row,ev) {
			if ($(ev.currentTarget).parent().is("tbody")) {
				this._colorRow(row.sectionRowIndex,1); // row selection index is base 0
			} else if  ($(ev.currentTarget).parent().attr('id') == this.options.tableId){
				if (! $(row).hasClass('nt-browse-row-header')){
					this._colorRow($(row).index(),1);
				}	
			}
			ev.stopPropagation()
			return this;
		},

		//------------------------------------------------------
		_onMouseOut : function(row,ev) {
			if ($(ev.currentTarget).parent().is("tbody")) {
				this._colorRow(row.sectionRowIndex);
			} else if  ($(ev.currentTarget).parent().attr('id') == this.options.tableId){
				if (! $(row).hasClass('nt-browse-row-header')){
					this._colorRow($(row).index());
				}	
			}
			ev.stopPropagation()
			return this;
		},

		//------------------------------------------------------
		_onDoubleClick : function(row,ev) {
			if ($(row).attr('data-nt-id') != ''){
				if($(row).attr('data-do') == "ds"){
					this.select(this);
				} else if($(row).attr('data-do') == "dc"){
					this.edit(this,2,'change');  
				} else if($(row).attr('data-do') == "dv"){	
					this.edit(this,5,'view');  
				}
			}	
			return this;
		},
		//------------------------------------------------------
		clickRow : function(row,ev) {
			var cell = $(ev.target).get(0); // This is the element clicked on
			if (this.options.table.nodeName=='TABLE'){
				if (cell.nodeName != 'TD'){ 
					cell = $(cell).closest('td').get(0); // might be something inside the TD, so get the TD
				}
				var sri = row.sectionRowIndex;
			} else {
				if (! $(cell).hasClass('.nt-browse-grid-cell')){
					cell = $(cell).closest('.nt-browse-grid-cell')
				}
				var sri = $(row).index()
			}			
			var cn = $(cell).index() + 1; 			// cellnumber // base 1	
			var i = this.options.rowSelected;       // this.rowSelected holds the index of the first row in the selcted block.// row selected is base 0
			this.options.rowSelected = parseInt(sri/this.options.rowsHigh) * this.options.rowsHigh; 
			this._colorRow(i);
			this._colorRow(sri);
			var phf = $(row).attr('data-nt-id');
			this.setvalue(phf);
			if (this.options.localStorage){
				$(this.options.divId).ntbrowsels("clickRow",row,ev);
			} else {
				this.server('_event_=rowclicked','_bidv_='+phf + '&_column_=' + cn);
			}	
			this.options.value = phf;
			if($(row).attr('data-do') == "ss"){
				this.select();
			} else if($(row).attr('data-do') == "sc"){
				this.edit(this,2,'change');
			}	
			return this;
		},

		//------------------------------------------------------
		_applyGreenBar : function() {
			if (this.options.table == null){
				return;
			}
			if (this.options.table.nodeName=='TABLE'){
				if (this.options.table.tBodies[0] == null){
					return;
				}
			}	
			if ((this.options.greenbar == 0) && (this.options.highlightSelected == 0) && (this.options.mouseover == 0)){
				return;
			}
			var b = 0;
			while(this.colorBlock(b) == 0){
				b++;
			}	
			return this;
		},

		//------------------------------------------------------
		_makeResizable : function() {
			if(this.options.resizable == 1){
				var _this = this;
				$('#' + _this.options.id.toLowerCase() + '_table_resize_div')
					.resizable({minwidth: _this.options.minwidth,minheight: _this.options.minheight,stop: function(event,ui){_this.resized();}});
			}
			return this;
		},

		//------------------------------------------------------
		resized : function() {
			this.server('_event_=resized&_width_=' + $(id).width() + '&_height_=' + $('#'+this.options.id.toLowerCase()+'_table_div').height());
			return this;
		},

		//------------------------------------------------------
		_restoreFocus : function() {
			if (this.options.column != 0) {
				if (this.options.table.nodeName=='TABLE'){
					$('#' + this.options.tableId + ' tbody > tr:first').children('td:eq('+this.options.column+')').find(':input:first').focus();
				}	
			}
			return this;
		},

		//------------------------------------------------------
		_setColumn : function(inp,e) {
			this.options.column = $(inp).closest('td').prevAll().length;
			return this;
		},

		//------------------------------------------------------
		_keyDownPaging : function(inp,e) {    // handle paging keys in EIP and locator fields
			if ((e.which == 191) && (e.shiftKey == true)){ // 191=?
				e.which = ntLookupKey;
			}

			switch(e.which){
				case 13: {
					$(inp).change();
					e.preventDefault();
					return false;
				}

				case $.ui.keyCode.PAGE_UP: {
					this.nav(inp.id,'previous');
					return false;
				}

				case $.ui.keyCode.PAGE_DOWN: {
					this.nav(inp.id,'next');
					return false;
				}

				case $.ui.keyCode.HOME: {
					if (e.ctrlKey==true){
						this.nav(inp.id,'first');
						return false;
					}
				}

				case $.ui.keyCode.END: {
					if (e.ctrlKey==true){
						this.nav(inp.id,'last');
						return false;
					}
				}

				//case 191:  // ?
				case ntLookupKey: {// F2 by default
					$("#"+inp.id+".hasDatepicker").each(
						function(i,v){
							e.preventDefault();
							$(inp).datepicker("show");
							return false;
						}
					);


					$("#"+inp.id).next(':button').each(
						function(i,v){
							$(this).click();
							return false;
						}
					)
				}
				return true;
			}
			return this;
		},

		//------------------------------------------------------
		// IE 8 does not support INPUT event. IE 9 handles INPUT event in a buggy way. // http://help.dottoro.com/ljhxklln.php
		// This method handles some of those cases
		KeyPressLoc : function(elem,ev) {      // Handle enter key in locator fields
			if (navigator.userAgent.indexOf('MSIE 8') > -1){
				$(elem).trigger('input');
			} else if (navigator.userAgent.indexOf('MSIE 9') > -1){
				switch(ev.which){
					case 8: // backspace
					case 46: // del key
					case 86: // ctrl-v
					case 88: // ctrl-x
						$(elem).trigger('input');
				}
			}
		},
		//------------------------------------------------------
		_keydown : function(inp,e) {  // bind up and down arrow keys in EIP in browse
			switch(e.which){
				case $.ui.keyCode.DOWN: {
					this._setColumn(inp,e);
					$(inp).closest('tr').nextAll(':eq(0)').children('td:eq('+this.options.column+')').find(':input:first').focus();
					e.which = 0;
					return false;
				}
				case $.ui.keyCode.UP: {
					this._setColumn(inp,e);
					$(inp).closest('tr').prevAll(':eq(0)').children('td:eq('+this.options.column+')').find(':input:first').focus();
					e.which = 0;
					return false;
				}
			}
			return this._keyDownPaging(inp,e);
		},

		//------------------------------------------------------
		_preContractVertically : function() {
			var _this=this;
			$(this.options.divId).find('[data-nt-ctd="true"]').each(function(i,elem){
				_this.setRowStatus(elem,true);
			});
			$(this.options.divId).find('[data-nt-ctd="false"]').each(function(i,elem){
				_this.setRowStatus(elem,false);
			});
			return this;
        },
		//------------------------------------------------------
		toggleRowStatus : function(elem) {
			//var l = this.options.rowsHigh-1;
			var tr = $(elem).closest('tr');
			if ($(elem).attr('data-nt-ctd')=='true'){
				var state=false;
			} else {
				var state=true;
			}	
			//var state = ($(tr).nextAll(':lt('+l+')').is(':visible'))
			this.setRowStatus(elem,state);
			this.server('_event_=expcon','_bidv_='+ $(tr).attr('data-nt-id') +'_status_=' + state);
			
        },
		//------------------------------------------------------
		setRowStatus : function(elem,state) { // if state is true then row much be contracted (ie minimised).

			var exp = 'ui-icon-' + this.options.expand;
			var con = 'ui-icon-' + this.options.contract;
			var l = this.options.rowsHigh-1;
			if (state){ 
				$(elem).removeClass(con).addClass(exp).attr('data-nt-ctd','true').closest('tr').children('td').each(function(){
					$(this).attr('rowspanwas',$(this).attr('rowspan'));
					$(this).attr('rowspan',1)
				});
				$(elem).closest('tr').nextAll(':lt('+l+')').hide();
			} else {
				$(elem).removeClass(exp).addClass(con).attr('data-nt-ctd','false').closest('tr').children('td').each(function(){
					$(this).attr('rowspan',$(this).attr('rowspanwas'));
				});
				$(elem).closest('tr').nextAll(':lt('+l+')').show();
			}
			return this;
		},
//------------------------------------------------------
		_prepColumns : function() {
			var _this=this;
			if ((this.options.addsec != '') && (this.options.addsec != undefined)){
				var k = $('#'+_this.options.id.toLowerCase()+'_table_div').find('th:last').find('[data-key]').attr('data-key');
				if (k == undefined){
					$('#'+_this.options.id.toLowerCase()+'_table_div').find('th:last').append('<div class="nt-right" data-key="true"><a href="#" id="' + _this.options.id.toLowerCase() + '-browse-access" class="nt-browse-titlebar-access"><span class="ui-icon ui-icon-key"></span></a></div>');
					//Secwin Button
					$('#' + _this.options.id.toLowerCase() + '-browse-access').hover(function(){
						$(this).addClass('ui-state-hover');
					}, function(){
						$(this).removeClass('ui-state-hover');
					}).click(function(){
						ntd.push('secwinwebuseraccess','','header',1,2,null,'','','_screen_=' + _this.options.addsec);
						return false;
					});
				}
			}
			return this;
		},

        //------------------------------------------------------
        // needs refactor
		ec : function(hcb) {          // checkbox on top of column to set checkbox in whole column.
			for(var i=0;i<this.options.table.tHead.rows[0].cells.length;i++){
				if (this.options.table.tHead.rows[0].cells[i] == hcb.parentNode){
					var c = i;
				}
			}
			this.quiet = 1;
			for(i=0;i<this.options.table.tBodies[0].rows.length;i++){
				var o = this.options.table.tBodies[0].rows[i].cells[c].firstChild;
				cb = getCheckbox(o);
				if (cb != null){
					cb.checked = hcb.checked;
					cb.onclick();
				}
			}
			this.quiet = 0;
			return this;
		},

        //------------------------------------------------------
        disableButton : function(elem){
			try{$(elem).attr("disabled","disabled").removeClass('ui-state-focus').button( "refresh" );} catch (e) {};
        },
        //------------------------------------------------------
        enableButton : function(elem){
			try{$(elem).removeAttr("disabled").removeClass('ui-state-focus').button("refresh");} catch (e) {};
        },
		
        //------------------------------------------------------		
        bbutton : function(elem){
			this.disableButton(elem);
			this.eip(elem);
        },
        //------------------------------------------------------
		eip : function(elem) {
			var n = $(elem).attr("name");
			var vl= $(elem).data('luv')
			if (vl==undefined){
				vl=FieldValue(elem);
			}

			this.server('_event_=eipaccepted&_action_=2&_eipclm_='+ n.replace(/__/g,":"),'_bidv_=' + $(elem).closest('tr').attr('data-nt-id'),'value='+vl);
			return this;
		},

        //------------------------------------------------------
		setvalue : function(v) {
			if (v && (v != null) && (v != '')){
				this.options.value = v;
			}

			return this;
		},

        //------------------------------------------------------
		//alertParent : function(cause){
		//	if (this.options.parent != '' && this.options.parent != this.options.id){
		//		var lurl = this.options.parent+'_'+this.options.procedure+'_value';
		//		this.sv(lurl.toLowerCase(),'_event_=1','_bidv_='+this.options.value,'_silent_=0','_cause_=' + cause);
		//	}

		//	return this;
		//},
		//------------------------------------------------------
		exportTo : function(fmt,elem){			
			$(elem).prepend('<div id="ExportProgressLLKP" class="nt-export-progress"></div>');
			this.state.exportButton = elem;
			this.state.exportProgress = $('#ExportProgressLLKP');						
			this.disableButton(this.state.exportButton);
			$(this.state.exportButton).css('opacity','1');
			this.get('_event_=export&_exportto_=' + fmt)
			this.setTimer(2000);
			return this;
		},
		//------------------------------------------------------
		exportProgress : function(p){
			if (p<100){
				$(this.state.exportProgress).css('width',p+'%');
				this.setTimer(2000);
			} else {
				$(this.state.exportProgress).css('width','0%');
				this.enableButton(this.state.exportButton);
			}
		},

		//------------------------------------------------------
		setTimer : function(t) {
			setTimeout("$('"+this.options.divId+"').ntbrowse('server','"+this.options.procedure+"','_event_=timer');",t);
			return this;	
		},
		//------------------------------------------------------
		timerStart: function(t) {
			setTimeout("$('"+this.options.divId+"').ntbrowse('server','"+this.options.procedure+"','_refresh_="+this.options.timerRefresh+"');",t);
			return this;	
        },
		//------------------------------------------------------
		timerStop: function() {
		
        },
		//------------------------------------------------------
		nav : function(f,d){
			this.fadeTable();
			if (this.options.json){
				this.serverJSON('_event_=nav&_refresh_='+d+'&focus=' + f);
			} else {
				this.server('_event_=nav&_refresh_='+d+'&focus=' + f);
			}	
			return this;
		},

        //------------------------------------------------------
		clearLocator : function(){
			$('#' + this.options.id + '_locator_a_div').find('input').val('');
			$('#' + this.options.id + '_locator_b_div').find('input').val('');
			this.fadeTable();
			this.locVal = '';
			this.server('_event_=locatorchanged&_refresh_=clearlocate')
			return this;
		},
        //------------------------------------------------------
		locate : function(elem,ev){
			if (this.locVal != $(elem).val()){
				if (ev.type=='input' || ev.type=='keypress'){
					this.locateChanged(elem);
				} else if (ev.type=='change'){
					this.goLocate(elem);
				}
			}	
			return this;	
			if ((ev.type=='input') && (this.state.blurring != true)){
				// to handle X in search field, always trigger if the locator is now blank.
				if ($(elem).val() == ''){
					this.clearLocator();
				} else {
					this.locateChanged(elem);
				}
				return this;
			}	
			this.state.blurring=false;
			if ((this.locVal != $(elem).val()) || (($(elem).attr('data-imm')!='true'))){ // tweaked for 7.31, to avoid /index.php?option=com_smf&Itemid=36&topic=5056.msg20017
				this.goLocate(elem);
			}
			return this;
		},
        //------------------------------------------------------
		// can be called from outside if the locator value has been changed.
		locateChanged : function(elem,force){
			// sync the values in both locators
			if (elem.id == 'locator1' + this.options.id){
				$('#locator2' + this.options.id).val($('#locator1' + this.options.id).val())
			} else if (elem.id == 'locator2' + this.options.id){
				$('#locator1' + this.options.id).val($('#locator2' + this.options.id).val())
			}
			// if imm then send the locator to the server
			if (($(elem).attr('data-imm')=='true') || (force)){
				this.goLocate(elem);
			}
		},
        //------------------------------------------------------
		// send the locator to the server
		goLocate : function(elem){
			this.fadeTable();
			this.locVal = $(elem).val();
			this.server('_event_=locatorchanged&_refresh_=locate',$(elem).attr("id")+'='+encodeURIComponent(this.locVal));
		},
        //------------------------------------------------------
		locateFocus : function(elem){
			if ($(elem).attr("data-noFocus") == "true"){
				$(elem).attr("data-noFocus","false");
			} else {	
				try{
					$('#osk').ntosk('getFocus',elem);
				} catch(e) {};
			}	
			try{
				$('#osk').ntosk('show');						
			} catch(e) {};	
		},
        //------------------------------------------------------
		locateBlur : function(){
			try{
				$('#osk').ntosk('startHide');
			} catch(e) {};	
			this.state.blurring=true;
		},
        //------------------------------------------------------
		locateAsifBlur : function(elem,e,i){
			if ( $(elem).val != this.locVal){
				this.locate(elem,e,i);				
			}
			try{
				$('#osk').ntosk('startHide');		
			} catch(e) {};	
		},
        //------------------------------------------------------
		sort : function(elem,ev){
			var dv = $(elem).attr('data-value')
			var dve;
			if (dv){
				dve = elem;
			} else {				

				dv = $(elem).children('a').attr('data-value');
				if (dv){
					dve = $(elem).children('a');
				}	
			}
			if (this.options.localStorage){
				$(this.options.divId).ntbrowsels("clientSideSort",elem,dv,ev,dve);				
			} else {
				this.server('_event_=sortchanged&_refresh_=sort',this.options.procedure+'_sort_' + this.options.randomid + '='+dv);
			} 	
			
			return this;
		},

        //------------------------------------------------------
        disable : function(){
			var _this=this;
			$(this.options.divId).find(':button').each(function(i,e){
			if($(e).attr('disabled') != 'disabled' ){
				$(e).attr("data-wait","wait").each(function(i,e){_this.disableButton(e)});;
			}
			})
			if (this.options.table.nodeName=='TABLE'){
				$('#' + this.options.tableId + ' tbody > tr').off('mouseover.bt mouseout.bt click.bt') ;
			}	
        },
		
        //------------------------------------------------------
        enable : function(){
			var _this=this;
			$(this.options.divId).find('[data-wait="wait"]').removeAttr("data-wait").each(function(i,e){_this.enableButton(e)});
			this._bindEvents();
			this.refresh();
        },
		
        //------------------------------------------------------
        hide : function(){
			$(this.options.divId).hide();
        },
        //------------------------------------------------------
        show : function(){
			$(this.options.divId).show();
        },
        //------------------------------------------------------
        hideTable : function(){
			$('#' + this.options.tableId).fadeOut(200);
			$('#' + this.options.tableId).hide();
        },
        //------------------------------------------------------
        fadeTable : function(){
			$('#' + this.options.tableId).find('input, textarea, button, select').prop("disabled", true);
			$('#' + this.options.tableId).fadeTo(200,0.5)
        },
        //------------------------------------------------------
        unhideTable : function(){
			$('#' + this.options.tableId).css({opacity:1});
			$('#' + this.options.tableId).show();
        },
        //------------------------------------------------------
        serverClearLocator : function(){
			$('#' + this.options.id + '_locator_b_div').find('input').val('');
			$('#' + this.options.id + '_locator_a_div').find('input').val('');
        },
        //------------------------------------------------------
        locatorFocus : function(){
			$('#' + this.options.id + '_locator_b_div').find('input').focus();
			$('#' + this.options.id + '_locator_a_div').find('input').focus();
        },

		//------------------------------------------------------
        hideLocator : function(){
			$('#' + this.options.id + '_locator_b_div').hide();
			$('#' + this.options.id + '_locator_a_div').hide();
        },

        //------------------------------------------------------
        unhideLocator : function(i){
			if (i & 1){
				$('#' + this.options.id + '_locator_b_div').show();
			} else {
				$('#' + this.options.id + '_locator_b_div').hide();
			}
			
			if (i & 2){
				$('#' + this.options.id + '_locator_a_div').show();
			} else {
				$('#' + this.options.id + '_locator_a_div').hide();
			}
        },

        //------------------------------------------------------
        hideSelectButton : function(i){
			if(i){
				$('#'+ this.options.id +'_div').find('[data-do="select"]').hide();
			} else {
				$('#'+ this.options.id +'_div').find('[data-do="select"]').show();
			}	
		},
        //------------------------------------------------------
        hideButton : function(b){
			$('#'+ this.options.id +'_div').find('[data-do="'+b+'"]').hide();
		},
        //------------------------------------------------------
        showButton : function(b){
			$('#'+ this.options.id +'_div').find('[data-do="'+b+'"]').show();
		},
		//------------------------------------------------------
        hideFormButtons : function(i){
			if (i==true){
				$('#' + this.options.id + '_update_b_div').find('[data-do="insert"]').hide();
				$('#' + this.options.id + '_update_a_div').find('[data-do="insert"]').hide();			
			} else {
				$('#' + this.options.id + '_update_b_div').find('[data-do="insert"]').show();
				$('#' + this.options.id + '_update_a_div').find('[data-do="insert"]').show();
			}
			$('#' + this.options.id + '_update_b_div').find('[data-do="copy"]').hide();
			$('#' + this.options.id + '_update_a_div').find('[data-do="copy"]').hide();
			$('#' + this.options.id + '_update_b_div').find('[data-do="change"]').hide();
			$('#' + this.options.id + '_update_a_div').find('[data-do="change"]').hide();
			$('#' + this.options.id + '_update_b_div').find('[data-do="deleteb"]').hide();
			$('#' + this.options.id + '_update_a_div').find('[data-do="deleteb"]').hide();		
			$('#' + this.options.id + '_update_b_div').find('[data-do="view"]').hide();
			$('#' + this.options.id + '_update_a_div').find('[data-do="view"]').hide();		
			$('#' + this.options.id + '_update_b_div').find('[data-do="export"]').hide();
			$('#' + this.options.id + '_update_a_div').find('[data-do="export"]').hide();		
        },

        //------------------------------------------------------
        unhideFormButtons : function(){
			$('#' + this.options.id + '_update_b_div').find('[data-do="insert"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="insert"]').show();
			$('#' + this.options.id + '_update_b_div').find('[data-do="copy"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="copy"]').show();
			$('#' + this.options.id + '_update_b_div').find('[data-do="change"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="change"]').show();
			$('#' + this.options.id + '_update_b_div').find('[data-do="deleteb"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="deleteb"]').show();			
			$('#' + this.options.id + '_update_b_div').find('[data-do="view"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="view"]').show();			
			$('#' + this.options.id + '_update_b_div').find('[data-do="export"]').show();
			$('#' + this.options.id + '_update_a_div').find('[data-do="export"]').show();			
        },

        //------------------------------------------------------
        hideNav : function(){
			$('#' + this.options.id + '_nav_a').hide();
			$('#' + this.options.id + '_nav_b').hide();
        },
		
        //------------------------------------------------------
        unhideNav : function(disablePrev,disableNext){
			var _this=this;
			$('#' + this.options.id + '_nav_a').show();
			$('#' + this.options.id + '_nav_b').show();
			if (disablePrev==true){
				$('#' + this.options.id + '_nav_b').find('[data-do="first"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_b').find('[data-do="first"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_b').find('[data-do="previous"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="first"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="previous"]').each(function(i,e){_this.disableButton(e)});
			} else if (disablePrev==false) {
				$('#' + this.options.id + '_nav_b').find('[data-do="first"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_b').find('[data-do="previous"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="first"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="previous"]').each(function(i,e){_this.enableButton(e)});
			}
			if (disableNext==true){
				$('#' + this.options.id + '_nav_b').find('[data-do="last"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_b').find('[data-do="next"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="last"]').each(function(i,e){_this.disableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="next"]').each(function(i,e){_this.disableButton(e)});
			} else if (disableNext==false){
				$('#' + this.options.id + '_nav_b').find('[data-do="last"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_b').find('[data-do="next"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="last"]').each(function(i,e){_this.enableButton(e)});
				$('#' + this.options.id + '_nav_a').find('[data-do="next"]').each(function(i,e){_this.enableButton(e)});
			}
        },
		
        //------------------------------------------------------
		edit : function(elem,action,header){    
			var actionname='';
			var actionform='';
			var actionFormOverride='';
			this.setvalue($(elem).closest('tr').attr('data-nt-id'));
			//this.options.form = this.options.form.replace("?","&"); breaks custom form urls that contain parameters
			switch(action){
			case 1: //Insert
				actionname ='insert_btn';
				actionform = $('[data-nt-id="'+this.options.value+'"]').attr('data-nt-insert');
				if (!actionform){
					actionform = this.options.formInsert;
				}
				break;
			case 2: //Change
				actionname ='change_btn';
				actionform = $('[data-nt-id="'+this.options.value+'"]').attr('data-nt-change');
				if (!actionform){
					actionform = this.options.formChange;
				}
				break;
			case 3: //Delete
				actionname ='change_btn';
				actionform = $('[data-nt-id="'+this.options.value+'"]').attr('data-nt-delete');
				if (!actionform){
					actionform = this.options.formDelete;
				}
				break;
			case 4: //Copy
				actionname ='copy_btn';
				actionform = $('[data-nt-id="'+this.options.value+'"]').attr('data-nt-copy');
				if (!actionform){
					actionform = this.options.formCopy;
				}
				break;
			case 5: //View
				actionname ='view_btn';
				actionform = $('[data-nt-id="'+this.options.value+'"]').attr('data-nt-view');
				if (!actionform){
					actionform = this.options.formView;
				}
				break;
			}
			if (actionform == ''){
				actionform = this.options.form;
			}
			if (this.options.formpopup){     
				header = ''; // don't default the header when called from a browse.
				ntd.push(actionform,'',header,1,action,null,this.options.procedure,this.options.value,'_parentProc_=' + this.options.parent,null,null,null,null,null,null,this.options.divId);
			} else {
				this.gotoPage(actionform,actionname,this.options.value);
			}
			return this;
		},

        //------------------------------------------------------
		deleteb : function(elem){
			var _this=this;
			if (this.options.confirmDelete){
				$('body').append('<div id="message_confirm" title="'+_this.options.confirmText+'">' + this.options.confirmDeleteMessage + '</div>');
				$( "#message_confirm" ).dialog({
					resizable: false,
					modal: true,
					buttons: [{
						text: _this.options.deleteText,
						click : function() {    
							$( this ).dialog( "close" );
							$( "#message_confirm" ).remove();
							_this.deletenow(elem);
						}
					}, {


						text: _this.options.cancelText,
						click: function() {
							$( this ).dialog( "close" );
							$( "#message_confirm" ).remove();
							return _this;
						}
					}]	
				});      
			} else {
				this.deletenow(elem);
			}
		},

		//------------------------------------------------------
		deletenow : function(elem){			
			this.options.form = this.options.form.replace("?","&");
			this.setvalue($(elem).closest('tr').attr('data-nt-id'));
			if (this.options.localStorage){
				$(this.options.divId).ntbrowsels("deleteb",this.options.value);				
			} else {
				this.serverPost('pressedButton=deleteb_btn','_event_=deleteb&_action_=3&_fromForm_='+ this.options.form,'_bidv_=' + this.options.value + '&_ajax_=1&_parentProc_=' +  this.options.parent + '&_parentRid_=' + this.options.parentrid);
			}	
			return this;
		},
        //------------------------------------------------------
		select : function(elem){
			if (elem){
				this.setvalue($(elem).closest('tr').attr('data-nt-id'));
			}

			if (this.options.popup){
				$('#'+ntd.getluf()).data('luv',this.options.value);
				$('#'+ntd.getluf()).change();
				$('#popup_'+ntd.getdlg().toLowerCase()+'_div').dialog('close'); // close does a ntd.pop
			} else{
				this.gotoPage(this.options.selectAction,'select_btn',this.options.value,this.options.lookupField);
				return this;
			};
		},

        //------------------------------------------------------
		cancel : function(){
			if (this.options.popup){
				$('#popup_'+ntd.getdlg().toLowerCase()+'_div').dialog('close'); // close does a ntd.pop
			} else {
				this.gotoPage(this.options.selectAction,'browsecancel_btn');
			}
			return this;
		},
        //------------------------------------------------------
		close : function(){
			if (this.options.popup){
				$('#popup_'+ntd.getdlg().toLowerCase()+'_div').dialog('close'); // close does a ntd.pop
			} else {
				this.gotoPage(this.options.closeAction,'close_btn');
			}
			return this;
		},
        //------------------------------------------------------
		rad : function(){     // Reset After Date
			this.eip(this.ct,this.eipclm,this.vs);
			return this;
		},

        //------------------------------------------------------
        gotoPage : function(a,n,v,l){
			$(':button').attr('disabled', 'disabled');
			$('#xdecfr').remove();
			var ht = '<form method = "POST" action="'+a+'" id="xdecfr">';
			if (n) ht = ht + '<input type="hidden" name="pressedbutton" value = "'+n+'" />';
			if (v) ht = ht + '<input type="hidden" name="_bidv_" value = "'+v+'" />';
			if (l) ht = ht + '<input type="hidden" name="lookupfield" value = "'+this.options.lookupField+'" />';
			if ($('#FormState')) ht = ht + '<input type="hidden" name="FormState" value = "'+$('#FormState').val()+'" />';
			ht = ht + '</form>';
			$(this.options.divId).append(ht)
			$('#xdecfr').submit();
			// this page terminates here
			return this;
		},

        //------------------------------------------------------
		sv : function(p0) {   // send async request to server
			var parms='';
			var _this=this;
			for(var d = 1; d < arguments.length; d++){
				parms += arguments[d] + '&';
			}
			parms += '_parentProc_=' + this.options.parent + '&_parentRid_=' + this.options.parentrid + '&_popup_=' + this.options.popup  + '&_rid_=' & this.options.randomid + '&_ajax_=1&_rnd_=' + Math.random().toString(36).substr(5);
			$.get(p0+ this.options.urlExt,parms,function(data){_this.onAjaxComplete(data);});
			return this;
		},

        //------------------------------------------------------
		get : function() {         // send async request to server procedure
			var parms='';
			var _this=this;
			for(var d = 0; d < arguments.length; d++){
				parms += arguments[d] + '&';
			}

			parms += '_parentProc_=' + this.options.parent + '&_parentRid_=' + this.options.parentrid + '&_ajax_=0&_popup_=' + this.options.popup + '&_rid_=' + this.options.randomid + '&_rnd_=' + Math.random().toString(36).substr(5);
			parms = parms.replace(/\r\n/g,"%0D%0A");
			parms = parms.replace(/\n\r/g,"%0D%0A");
			parms = parms.replace(/\r/g,"%0D%0A");
			parms = parms.replace(/\n/g,"%0D%0A");
			document.location = this.options.procedure + this.options.urlExt + '?' + parms;
			return this;
		},
        //------------------------------------------------------
		server : function() {         // send async request to server procedure
			var parms='';
			var _this=this;
			for(var d = 0; d < arguments.length; d++){
				parms += arguments[d] + '&';
			}

			parms += '_parentProc_=' + this.options.parent + '&_parentRid_=' + this.options.parentrid + '&_ajax_=1&_popup_=' + this.options.popup + '&_rid_=' + this.options.randomid + '&_rnd_=' + Math.random().toString(36).substr(5);
			parms = parms.replace(/\r\n/g,"%0D%0A");
			parms = parms.replace(/\n\r/g,"%0D%0A");
			parms = parms.replace(/\r/g,"%0D%0A");
			parms = parms.replace(/\n/g,"%0D%0A");
			$.get(this.options.procedure + this.options.urlExt,parms,function(data){_this.onAjaxComplete(data);});
			return this;
		},

        //------------------------------------------------------
		serverJSON : function() {         // send async request to server procedure
			var parms='';
			var _this=this;
			for(var d = 0; d < arguments.length; d++){
				parms += arguments[d] + '&';
			}

			parms += '_parentProc_=' + this.options.parent + '&_parentRid_=' + this.options.parentrid + '&_ajax_=1&_popup_=' + this.options.popup + '&_rid_=' + this.options.randomid + '&_rnd_=' + Math.random().toString(36).substr(5);
			parms = parms.replace(/\r\n/g,"%0D%0A");
			parms = parms.replace(/\n\r/g,"%0D%0A");
			parms = parms.replace(/\r/g,"%0D%0A");
			parms = parms.replace(/\n/g,"%0D%0A");
			$.getJSON(this.options.procedure + this.options.urlExt,parms,function(data){_this.onAjaxComplete(data);});
			return this;
		},

        //------------------------------------------------------
		serverPost : function() {     // send async request POST to server procedure
			var parms='';
			var _this=this;
			for(var d = 0; d < arguments.length; d++){
				parms += arguments[d] + '&';
			}

			parms += '_ajax_=1&_parentProc_=' + this.options.parent + '&_parentRid_=' + this.options.parentrid + '&_popup_=' + this.options.popup + '&_rid_=' & this.options.randomid + '&_rnd_=' + Math.random().toString(36).substr(5);
			$.post(this.options.procedure+ this.options.urlExt,parms,function(data){_this.onAjaxComplete(data);});
			return this;
		},

        //------------------------------------------------------
		onAjaxComplete : function(data) {
			xmlProcess(data);
			//this.ready();  // no need to call ready, the xmlProcess will recreate the object if needed.
			return this;
		},
        //------------------------------------------------------
		onAjaxCompleteJSON : function(data) {

			xmlProcess(data);
			//this.ready();  // no need to call ready, the xmlProcess will recreate the object if needed.
			return this;
		},
        //------------------------------------------------------
		process : function(data) {
		}
		

//------------------------------------------------------
});

$.extend( $.ui.ntbrowse, {
        version: "@VERSION"
});

})( jQuery );

///////////////////////////////////////////////////////
// end ntbrowse
///////////////////////////////////////////////////////


$(window).unload(function() {
  $(':ui-ntbrowse').ntbrowse("destructor");
});
