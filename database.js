/***
NetTalk Mobile Database
***/
var database={
  name: "invoice",
  version:1,
  handle:{},
  open:0,
  error:"",
  errorcode:0,
  synchost: "http://192.168.1.6",
  synctimer: 15,   // seconds
  deviceid: "",
  user:"",
  password:"",
  token:"",
  status:0,
  tables:[
    { name: "invoice",
      syncproc: "syncinvoice",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'inv_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'inv_timestampkey'",unique: false, fields:["ts"]},
        {name:"'inv_numberkey'",unique: false, fields:["invoicenumber"]},
        {name:"'inv_customerkey'",unique: false, fields:["customerguid"]}
      ],
      relations: [
        {type:"manytoone",table:"customer",links:{customerguid:"guid"}}
        ,{type:"onetomany",table:"lineitems",links:{guid:"invoiceguid"}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        invoicenumber:0,
        customerguid:"",
        date:"",
        paid:0,
        terms:0
      }
    },
    { name: "shippers",
      syncproc: "syncshippers",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'shi_shipperkey'",unique: true, fields:["shipper"]},
        {name:"'shi_servertimestampkey'",unique: false, fields:["tst"]},
        {name:"'shi_timestampkey'",unique: false, fields:["ts"]}
      ],
      relations: [
        {type:"onetomany",table:"linkcountriesshippers",links:{guid:"shipperguid"}}
        ,{type:"onetomany",table:"customer",links:{guid:"shipperguid"}}
      ],
      record: {
        guid:"",
        ts:0,
        tst:0,
        dts:0,
        shipper:"",
        email:"",
        phone:""
      }
    },
    { name: "product",
      syncproc: "syncproduct",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'pro_timestampkey'",unique: false, fields:["ts"]},
        {name:"'pro_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'pro_namekey'",unique: false, fields:["name"]}
      ],
      relations: [
        {type:"onetomany",table:"lineitems",links:{guid:"productguid"}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        name:"",
        rrp:0
      }
    },
    { name: "lineitems",
      syncproc: "synclineitems",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'lin_timestampkey'",unique: false, fields:["ts"]},
        {name:"'lin_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'lin_productkey'",unique: false, fields:["productguid"]},
        {name:"'lin_invoicekey'",unique: false, fields:["invoiceguid"]}
      ],
      relations: [
        {type:"manytoone",table:"invoice",links:{invoiceguid:"guid"}}
        ,{type:"manytoone",table:"product",links:{productguid:"guid"}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        invoiceguid:"",
        productguid:"",
        price:0,
        quantity:0
      }
    },
    { name: "customer",
      syncproc: "synccustomer",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'cus_timestampkey'",unique: false, fields:["ts"]},
        {name:"'cus_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'cus_namekey'",unique: false, fields:["lastname","firstname"]},
        {name:"'cus_countrykey'",unique: false, fields:["countrycode"]},
        {name:"'cus_shipperkey'",unique: false, fields:["shipperguid"]}
      ],
      relations: [
        {type:"manytoone",table:"shippers",links:{shipperguid:"guid"}}
        ,{type:"manytoone",table:"countries",links:{countrycode:"guid"}}
        ,{type:"onetomany",table:"invoice",links:{guid:"customerguid"}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        firstname:"",
        lastname:"",
        company:"",
        phone:"",
        email:"",
        countrycode:"",
        shipperguid:""
      }
    },
    { name: "countries",
      syncproc: "synccountries",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'cou_timestampkey'",unique: false, fields:["ts"]},
        {name:"'cou_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'cou_countrycodekey'",unique: true, fields:["countrycode"]},
        {name:"'cou_countrykey'",unique: false, fields:["country"]}
      ],
      relations: [
        {type:"onetomany",table:"linkcountriesshippers",links:{countrycode:"countryguid"}}
        ,{type:"onetomany",table:"customer",links:{guid:"countrycode"}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        countrycode:"",
        country:""
      }
    },
    { name: "linkcountriesshippers",
      syncproc: "synclinkcountriesshippers",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'lcs_timestampkey'",unique: false, fields:["ts"]},
        {name:"'lsc_servertimestampkey'",unique: false, fields:["sts"]},
        {name:"'lsc_countrykey'",unique: true, fields:["countryguid","shipperguid"]},
        {name:"'lcs_shipperkey'",unique: false, fields:["shipperguid","countryguid"]}
      ],
      relations: [
        {type:"manytoone",table:"countries",links:{countryguid:"countrycode",shipperguid:""}}
        ,{type:"manytoone",table:"shippers",links:{shipperguid:"guid",countryguid:""}}
      ],
      record: {
        guid:"",
        ts:0,
        sts:0,
        dts:0,
        countryguid:"",
        shipperguid:""
      }
    },
    { name: "thisdevice",
      syncproc: "syncthisdevice",
      objectStore:{},
      everythingafter:0,
      primarykeyfield: "guid",
      timestampfield: "ts",
      servertimestampfield: "sts",
      deletedtimestampfield: "dts",
      indexes: [
        {name:"'tdh_timestampkey'",unique: false, fields:["ts"]},
        {name:"'thd_servertimestampkey'",unique: false, fields:["sts"]}
      ],
      relations: [
      ],
      record: {
        guid:"",
        sts:0,
        ts:0,
        dts:0,
        clientdeviceid:"",
        phonenumber:"",
        password:"",
        salt:"",
        synchost:""
      }
    }
  ],
  invoice:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[0],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[0],resultset)})},
    empty: function(){idbEmpty(database,database.tables[0]);}
  },
  shippers:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[1],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[1],resultset)})},
    empty: function(){idbEmpty(database,database.tables[1]);}
  },
  product:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[2],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[2],resultset)})},
    empty: function(){idbEmpty(database,database.tables[2]);}
  },
  lineitems:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[3],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[3],resultset)})},
    empty: function(){idbEmpty(database,database.tables[3]);}
  },
  customer:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[4],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[4],resultset)})},
    empty: function(){idbEmpty(database,database.tables[4]);}
  },
  countries:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[5],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[5],resultset)})},
    empty: function(){idbEmpty(database,database.tables[5]);}
  },
  linkcountriesshippers:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[6],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[6],resultset)})},
    empty: function(){idbEmpty(database,database.tables[6]);}
  },
  thisdevice:{
    table: {},
    record: {},
    view:  function(){idbSelect(database,database.tables[7],['guid'],true,0,0,0,function(resultset){idbShowResult(database.tables[7],resultset)})},
    empty: function(){idbEmpty(database,database.tables[7]);}
  },
  last:0
};
database.invoice.table = database.tables[0];
database.invoice.record = database.tables[0].record;
database.shippers.table = database.tables[1];
database.shippers.record = database.tables[1].record;
database.product.table = database.tables[2];
database.product.record = database.tables[2].record;
database.lineitems.table = database.tables[3];
database.lineitems.record = database.tables[3].record;
database.customer.table = database.tables[4];
database.customer.record = database.tables[4].record;
database.countries.table = database.tables[5];
database.countries.record = database.tables[5].record;
database.linkcountriesshippers.table = database.tables[6];
database.linkcountriesshippers.record = database.tables[6].record;
database.thisdevice.table = database.tables[7];
database.thisdevice.record = database.tables[7].record;
//------------------------
var syncTimer;
//------------------------
function syncDatabase(){
  idbSyncAll(database,0)
}
//------------------------
function syncTimerOn(){
  if(database.synctimer){
    syncTimer = setInterval(syncDatabase,database.synctimer*1000); // sync database on a timer
  }
}
//------------------------
function syncTimerOff(){
  clearInterval(syncTimer);
}

//------------------------
$(document).ready(function() {
  setTimeout(syncDatabase,5000); // sync database soon after program starts
  syncTimerOn()
});
//------------------------

