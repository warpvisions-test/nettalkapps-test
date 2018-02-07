/**********************************************************************************************************
function idbOpen        (db,oncomplete)  

-- these functions write away table.record. 
function idbWrite       (db,table,record,fromSync,oncomplete,onerror)       		[idbPut -- idbAdd]
function idbAdd         (db,table,record,fromSync,oncomplete,onerror)              	[idbOpen -- idbSync]
function idbPut         (db,table,record,fromSync,oncomplete,onnotfound,onerror)    [idbOpen -- idbSync]
function idbDelete      (db,table,guid,oncomplete,onerror)                  		[idbOpen] 
function idbMarkDelete  (db,table,guid,oncomplete,onnotfound,onerror)       		[idbOpen -- idbSync]
function idbEmpty       (db,table,oncomplete,onerror)                       		[idbOpen]
function idbGet         (db,table,guid,oncomplete,onnotfound,onerror)       		[idbOpen]  

function idbSelect      (db,table,orderBy,incDeleted,maxRecords,onrecord,i,oncomplete,onerror)    [idbOpen -- idbSort]
  function idbSort       (resultset,orderBy)                                		[idbSortBy]
    function idbSortBy    (orderBy)

function idbFullSync    (db,table,oncomplete,onerror)                       		[idbEmpty -- idbSync]
  function idbSync        (db,table,oncomplete,onerror)                     		[idbSummary -- idbWrite] 
    function idbSummary     (db,table,resultset,oncomplete,onerror)
	
***********************************************************************************************************/	

//======================================================================================================================================
// these functions are generic
//======================================================================================================================================
function login(db,user,password){
	var syncPost = {user:user,
					password:password
					}
	$.ajax({
	  url: db.synchost + '/login',
	  type:"POST",
	  username:db.user,
	  password:db.password,		  
	  data:JSON.stringify(syncPost),
	  contentType:"application/json; charset=utf-8",
	  dataType:"json",
	  success: function(data){handleReply(data)}
	})		
	function handleReply(data){
		var response =  'login_response'
		db.token = data[response].token;
		//console.log('db.token=' + db.token)
		db.status = data[response].status;		
	}
}
//======================================================================================================================================
// WARNING - this operation is destructive. But useful for development, and testing purposes
function idbNuke(db){
	//idbClose(db,doNuke);	
	//function doNuke(){
		console.log('Nuking ' + db.name)
		var req = indexedDB.deleteDatabase(db.name);
		req.onsuccess = function () {
			console.log("Deleted database pending - navigate away from this site to complete purge");
		};
		req.onerror = function () {
			console.log("Couldn't delete database");
		};
		req.onblocked = function () {
			console.log("Couldn't delete database due to the operation being blocked. Database will be nuked as soon as it becomes unblocked. Navigate away from this site to complete purge");
		};
		return false;
	//};	
}
//======================================================================================================================================
function idbOpen(db,oncomplete){
	//console.log('idbOpen ' + db.open);
	if(db.open){
		if (oncomplete)	{oncomplete()}
		return
	}
	db.error = 0;
	//console.log('opening database ' + db.name + ' version ' + db.version);
	var request = window.indexedDB.open(db.name, db.version);
	//-------------------------------
	request.onerror = function(event) {  									// Do something with request.errorCode!
		//console.log('database failed to open ' + event.target.error.message + ' .. ' + event.target.error.name);
		db.errorcode = event.target.error.name;
		db.error = event.target.error.message;
		return true; 														// returning true suppresses the error bubbling up
	};
	//-------------------------------
	request.onversionchange = function(event) { 						
		//console.log('Version change when opening db')
	}
	//-------------------------------
	request.onupgradeneeded = function(event) { 							// this gets called before onSuccess
		//console.log('upgrading database');
		db.handle = event.target.result;
		var i=0;
		var j=0;
		for (i in db.tables){
			// create the table with primary key
			db.tables[i].objectStore = db.handle.createObjectStore(db.tables[i].name, { keyPath: db.tables[i].primarykeyfield }); // keypath = primary key component
			// create additional indexes
			for (j in db.tables[i].indexes){
				db.tables[i].objectStore.createIndex(db.tables[i].indexes[j].name, db.tables[i].indexes[j].fields, { unique: db.tables[i].indexes[j].unique }); // create a non-unique index on this column
			}
		}		
	};
	//-------------------------------
	request.onsuccess = function(event) {	// Do something with request.result!
		//console.log('database opened');
		var i=0;
		db.handle = event.target.result;
		
		db.handle.onerror = function(event) {		// Generic error handler for all errors targeted at this database's requests!
			db.errorcode = event.target.error.name;
			db.error = event.target.error.message;
			//console.log('database Error ' + db.errorcode + ' .. ' + db.error);
			return true;
		};		
		db.errorcode = 0;
		db.error = "";
		db.open = true;		
		if (oncomplete)	{oncomplete()}		
	};
	//-------------------------------
};
//======================================================================================================================================
function idbClose(db,oncomplete,onerror){
	if(db.open){
		var request = db.handle.close();
		//-------------------------------
		request.onerror = function(event) {  									// Do something with request.errorCode!
			db.errorcode = event.target.error.name;
			db.error = event.target.error.message;
			if (onerror)	{onerror()}
			return true; 														// returning true suppresses the error bubbling up
		};

		//-------------------------------
		request.onsuccess = function(event){
			//console.log('database closed')
			db.errorcode = 0;
			db.error = "";
			db.open = false;		
			if (oncomplete)	{oncomplete()}				  
		}
	}	
}
//======================================================================================================================================
function idbWrite(db,table,record,fromSync,oncomplete,onerror){
	idbPut(db,table,record,fromSync,function() { 
		// on complete
		if(oncomplete){  // on put complete pass the record guid to the oncomplete function
			oncomplete(record[table.primarykeyfield])
		}	
	}, function() { 					  
		//not found
		idbAdd(db,table,record,fromSync,function(){
				// on complete
				if(oncomplete){oncomplete(record[table.primarykeyfield])} // on add complete passes the new guid to the oncomplete function
			},onerror)
	}, function() { 					
		// on error
		if(onerror){onerror()}
	})
}
//======================================================================================================================================
// small utility function to prime the primary key field with a random string value. Preserves existing value if it exists.
function idbPrimeGuid(table,record){
	if (!record[table.primarykeyfield]){
		record[table.primarykeyfield] = Math.random().toString(36).substr(3,8).toUpperCase() + Math.random().toString(36).substr(3,8).toUpperCase(); // 16 chars 0-9, A-Z
	}	
}
//======================================================================================================================================
// 	prime record fields before calling this function. example;	database.customer.record.firstname = "Bruce";
function idbAdd(db,table,record,fromSync,oncomplete,onerror){
	//console.log('idbAdd')
	idbOpen(db,doAdd);	
	function doAdd(){
		idbPrimeGuid(table,record);
		if (!fromSync){
			if(table.timestampfield){
				record[table.timestampfield] = Date.now();
			}
			if(table.servertimestampfield){
				record[table.servertimestampfield] = 0;
			}	
		}	
		var request = db.handle.transaction([table.name],"readwrite").objectStore(table.name).add(record);
		//----	// callbacks for request 
		request.onsuccess = function(event) {
			db.errorcode = 0;
			db.error = "";
			if (oncomplete)	{oncomplete()};
			if (!fromSync){
				idbSync(db,table); // syncs are done asyncronously.
			}
		}
		//----
		request.onerror = function(event){
			//console.log('add failed ' + event.target.error.message + ' .. ' + event.target.error.name);
			db.errorcode = event.target.error.name;
			db.error = event.target.error.message;
			if (onerror){onerror()};
			return true; 														// returning true suppresses the error bubbling up		
		}
	}
}	
//======================================================================================================================================
function idbPut(db,table,record,fromSync,oncomplete,onnotfound,onerror){
	//console.log('idbPut')
	idbOpen(db,doPut);
	function doPut(){
		//console.log('do put');
		var savRecord = record;
		var objectstore = db.handle.transaction([table.name],"readwrite").objectStore(table.name);
		var request = objectstore.get(record[table.primarykeyfield]);

		// callbacks for get request 
		request.onsuccess = function(event) {
			//console.log('get success')
			if (event.target.result){			
				if (!fromSync && table.timestampfield){
					record[table.timestampfield] = Date.now();
				}				
				var requestUpdate = objectstore.put(savRecord);
				requestUpdate.onsuccess = function(event) {
					//console.log('put was a success. fromsync = ' + fromSync);
					db.errorcode = 0;
					db.error = "";	
					record = savRecord;	
					if (oncomplete)	{oncomplete()}
					if (!fromSync){
						idbSync(db,table); // syncs are done asyncronously.
					}	
				};				
				requestUpdate.onerror = function(event) {
					if (onerror){onerror()};
				}
			} else {
				if (onnotfound)	{
					onnotfound()
				} else {
					db.errorcode = "RecordNotFound";
					db.error = "The requested record was not found in the database";
					//console.log('database Error ' + db.errorcode + ' .. ' + db.error);
				}					
			}						
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}
	}
}
//======================================================================================================================================
// deletes a record from the database - probably should not be used for tables being sync'd. Use idbMarkDelete instead.
// this one is called from idbPurge
function idbDelete(db,table,guid,oncomplete,onerror){
	idbOpen(db,doDelete);
	function doDelete(){
		if (!guid){
			guid = table.record[table.primarykeyfield]
		}	
		//console.log('do delete record with ' + table.primarykeyfield + ' = ' + guid );
		var request = db.handle.transaction([table.name],"readwrite").objectStore(table.name).delete(guid);

		// callbacks for request 
		request.onsuccess = function(event) {
			//console.log('delete was a success');
			db.errorcode = 0;
			db.error = "";
			if (oncomplete)	{oncomplete()}				
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}
	}
}	
//======================================================================================================================================
function idbMarkDelete(db,table,guid,oncomplete,onnotfound,onerror){
	//console.log('idbMarkDelete')
	idbOpen(db,doMarkDelete);
	function doMarkDelete(){
		//console.log('do MarkDelete  -- getting guid ' + guid);
		var objectstore = db.handle.transaction([table.name],"readwrite").objectStore(table.name);
		var request = objectstore.get(guid);

		// callbacks for get request 
		request.onsuccess = function(event) {
			if (event.target.result){							
				table.record = request.result;
				if (table.deletedtimestampfield){
					table.record[table.deletedtimestampfield] = Date.now(); // mark record as deleted
				}	
				if (table.timestampfield){
					table.record[table.timestampfield] = Date.now();
				}	
				//console.log('deleting |' + table.record.guid + ' | ' + table.record.ts + ' | ' + table.record.sts + ' | ' + table.record.dts + ' | ' + table.record.firstname +  ' | ' + table.record.lastname);

				var requestUpdate = objectstore.put(table.record);
				
				requestUpdate.onsuccess = function(event) {
					//console.log('idbMarkDelete put was a success.');
					db.errorcode = 0;
					db.error = "";	
					if (oncomplete){oncomplete()};
					idbSync(db,table); // syncs are done asyncronously.
				};				
				requestUpdate.onerror = function(event) {
					if (onerror){onerror()};
				}
			} else {
				if (onnotfound)	{
					onnotfound()
				} else {
					db.errorcode = "RecordNotFound";
					db.error = "The requested record was not found in the database";
					//console.log('database Error ' + db.errorcode + ' .. ' + db.error);
				}					
			}						
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}
	}

}	
//======================================================================================================================================
function idbEmpty(db,table,oncomplete,onerror){
	//console.log('idbEmpty')
	idbOpen(db,doEmpty);
	function doEmpty(){
		var request = db.handle.transaction([table.name],"readwrite").objectStore(table.name).clear();		
		request.onsuccess = function(){
			//console.log('idbEmpty complete')
			if (oncomplete)	{oncomplete()}				
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}		
	}
}	

//======================================================================================================================================
function idbGet(db,table,guid,oncomplete,onnotfound,onerror){ 
	switch(guid){
	case '_first_':
		idbSelect(db,table,table.primarykeyfield,false,1, function(i,record){
				guid = record[table.primarykeyfield];	
				idbGet(db,table,guid,oncomplete,onnotfound,onerror);			
				return false; // terminate select loop
			},0,0,onerror);
		return;
	}
	idbOpen(db,doGet);
	function doGet(){
		//console.log('do get');
		var request;
		//console.log('getting record guid=' + guid)
		request = db.handle.transaction([table.name]).objectStore(table.name).get(guid);
		// callbacks for request
		request.onsuccess = function(event) {
			//console.log('on success')
			if (event.target.result){
				db.errorcode = 0;
				db.error = "";
				if (oncomplete)	{					
					oncomplete(event.target.result)
					}
			} else {
				if (onnotfound)	{
					onnotfound()
				} else {
					db.errorcode = "RecordNotFound";
					db.error = "The requested record was not found in the database";
					//console.log('database Error ' + db.errorcode + ' .. ' + db.error);				
				}					
			}						
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}		
	}
}	

//======================================================================================================================================
// Counts the number of rows in the table, and passes the value to oncomplete. 
function idbRecords(db,table,oncomplete,onerror){
	idbOpen(db,doCount);
	function doCount(){
		var request = db.handle.transaction([table.name]).objectStore(table.name).count();
		request.onsuccess = function(event) {
			if (oncomplete)	{
				oncomplete(request.result);
			}	
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}		
	}
}

//======================================================================================================================================
// Makes sure the table contains a minimum of 1 record. Useful for settings tables, which contains the host value, so can't be primed with a sync.
// prime fields before calling this. for example; database.customer.record.firstname = "Bruce"; Guid field is primed here.
function idbOne(db,table,oncomplete,onerror){
	idbOpen(db,doOne);
	function doOne(){
		idbRecords(db,table,doAdd,doError);
	}
	function doAdd(r){
		if (r==0){
			idbPrimeGuid(table,table.record);  // TODO remove reference to table.record
			idbAdd(db,table,false,oncomplete,onerror)
		}
		return;
	}
	function doError(){
		if (onerror){ onerror()};
	}
}
//======================================================================================================================================
// If onRecord is passed then that is called for each returned record. If not passed then the whole result sent to oncomplete
function idbSelect(db,table,orderBy,incDeleted,maxRecords,onRecord,i,oncomplete,onerror){
	//console.log('IDB SELECT')
	idbOpen(db,doList);
	function doList(){
		var resultset=[];
		var request = db.handle.transaction([table.name]).objectStore(table.name).openCursor();		
		var recs = 0;
		var result = true;
		request.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor && (recs < maxRecords || maxRecords == 0)){
				if( !table.deletedtimestampfield || incDeleted == true || cursor.value[table.deletedtimestampfield] == 0){ // don't include records with dts in the result set.
					if (onRecord){
						result = onRecord(i,cursor.value) // return false to terminate loop
					} else {
						resultset.push(cursor.value);
					}	
				}
				recs += 1;
				if (result==true){
					cursor.continue(); // triggers another success event
				}	
			} else {
				if(orderBy){
					idbSort(resultset,orderBy)
				};
				if (oncomplete)	{
					oncomplete(resultset)
				}
			}
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}		
	}
}
//======================================================================================================================================
// orderby = ['fieldname','fieldname',...]
function idbSort(resultset,orderBy){
	var order=[];
	if (Array.isArray(orderBy)){
		order = orderBy;
	} else {
		order.push(orderBy);
	}
	resultset.sort(idbSortBy(order));
}
//======================================================================================================================================
function idbSortBy(orderBy){
	return function(a, b) {
		//console.log('idbSortBy orderBy=' + orderBy + ' ' + orderBy.length)
		var field='';
		var left='';
		var right='';
		for (var i=0; i < orderBy.length ; i++){
			field = orderBy[i];
			if (field.substring(0,1)=='-'){ // reverse sort order 
				field = field.substring(1)
				left = b[field]
				right = a[field]				
			} else {
				left = a[field]
				right = b[field]
			}	
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
		} 
		return 0;			
	}
}
//======================================================================================================================================
// sync all the tables in the database one at a time
function idbSyncAll(db,startTable,oncomplete,onerror){
	if (startTable < db.tables.length){
		idbSync(db,db.tables[startTable],doNext,onerror,startTable+1)
	}
	function doNext(i){
		idbSyncAll(db,i,oncomplete,onerror)
	}
}
//======================================================================================================================================
// deletes all local data and then syncs from there
// calls same onerror if empty fails or sync fails
function idbFullSync(db,table,oncomplete,onerror){
	//console.log('idbFullSync')
	idbEmpty(db,table,function(){
		//console.log('calling idbSync')
		idbSync(db,table,oncomplete,onerror);
	},onerror)
}
//======================================================================================================================================
// sync one table in the database
function idbSync(db,table,oncomplete,onerror,oncompleteparm){ 
	var resultset=[];
	idbSummary(db,table,resultset,doSend,onerror);
	function doSend(){
		var i=0;
		var recs='';
		var act = 'action';
		var syncPost = {token:db.token,
						table:table.name,
						[act]:'sync',
						everythingafter:table.everythingafter
						}
		if (resultset.length){
			syncPost[table.name]=resultset
		}	
						
		$.ajax({
		  url: db.synchost + '/' + table.syncproc,
		  type:"POST",
		  data:JSON.stringify(syncPost),
		  headers: { "Authorization": "Basic " + btoa(db.user + ":" + db.password) },		  
		  contentType:"application/json; charset=utf-8",
		  dataType:"json",
		  success: function(data){handleReply(data)},
		  error: function(){if (onerror) { onerror() } }
		})		
		function handleReply(data){
			var response = table.syncproc + '_response'
			recs = data[response][table.name];
			if (recs){ // may be nothing to receive.
				putNext()
			} else {	
				if (oncomplete)	{oncomplete(oncompleteparm)}
			}
		}
		function putNext(){
			//console.log('putnext i = ' + i + 'recs.length=' + recs.length);
			if (i > recs.length-1){
				if (oncomplete)	{oncomplete(oncompleteparm)}
				return
			}	
			var record = recs[i];
			i++;
			idbWrite(db,table,record,true,function(){
				putNext()
			});				
		}
	}
}
//======================================================================================================================================
function idbSummary(db,table,resultset,oncomplete,onerror){
    //console.log('IDBSUMMARY')
	idbOpen(db,doList);	
	function doList(){		
		//console.log('idbSummary do list');
		resultset.length = 0;		
		table.everythingafter = 0;
		var drecord ={}
		var request = db.handle.transaction([table.name]).objectStore(table.name).openCursor();		
		request.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor){
				if (table.timestampfield && table.servertimestampfield){
					if (cursor.value[table.timestampfield] != cursor.value[table.servertimestampfield]){  // only interested in records that have been altered here
						if (cursor.value[table.deletedtimestampfield]){											// if record was deleted, just send minimal info
							drecord={}
							drecord[table.primarykeyfield] = cursor.value[table.primarykeyfield];
							drecord[table.deletedtimestampfield] = cursor.value[table.deletedtimestampfield];
							drecord[table.servertimestampfield] = cursor.value[table.servertimestampfield];
							resultset.push(drecord);
						} else {
							resultset.push(cursor.value);													// otherwise send whole record
						}	
					} else {
						if (table.everythingafter < cursor.value[table.servertimestampfield]){					// looking for the youngest unchanged record
							table.everythingafter = cursor.value[table.servertimestampfield]
						}
					}				
				}	
				cursor.continue();
			} else {
				//console.log('completed, recs= ' + resultset.length)
				if (oncomplete)	{oncomplete()}				
			}
		}
		request.onerror = function(){
			if (onerror){ onerror()};
		}			
	}
}

// sends the contents of the result set to the console view. Used mostly for debugging.
function idbShowResult(table,resultset){
	var value='';
	console.log('Database: database  ; Table: ' + table.name + ' ; Records: ' + resultset.length);
	console.log(Object.keys(table.record))
	if(resultset.length){
		for (var rowNum in resultset){
			value = ''
			for(var i in resultset[rowNum]) {
				value = value + ' | ' + resultset[rowNum][i];
			}	
			console.log(value);
		}
	}	
}
