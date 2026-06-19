function getHeaders_() {
  return ['id','createdAt','updatedAt','jobName','partCount','sheetCount','usedPercent','status','fileId','fileUrl','material','thicknessMm','revision','updatedBy','orderCode','customer','dueDate'];
}
function setupNiceNesting() {
  const p=PropertiesService.getScriptProperties(),h=getHeaders_();
  let s=p.getProperty('SPREADSHEET_ID'),f=p.getProperty('DRIVE_FOLDER_ID'),k=p.getProperty('API_SECRET');
  if(!s){const b=SpreadsheetApp.create('NiceNesting Database'),t=b.getSheets()[0];s=b.getId();t.setName('Jobs');t.getRange(1,1,1,h.length).setValues([h]);t.setFrozenRows(1);p.setProperty('SPREADSHEET_ID',s);}
  if(!f){const d=DriveApp.createFolder('NiceNesting Online Files');f=d.getId();p.setProperty('DRIVE_FOLDER_ID',f);}
  if(!k){k=Utilities.getUuid().replace(/-/g,'');p.setProperty('API_SECRET',k);}
  const r={spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${s}/edit`,driveFolderUrl:`https://drive.google.com/drive/folders/${f}`,apiSecret:k};console.log(JSON.stringify(r,null,2));return r;
}
function doGet(){return jsonResponse_({ok:true,app:'NiceNesting',version:2,message:'API is ready'});}
function doPost(e) {
  try{const r=JSON.parse((e.postData&&e.postData.contents)||'{}');assertConfigured_();assertSecret_(r.secret);
    if(r.action==='save')return jsonResponse_(saveJob_(r.job||decodeJobPackage_(r.jobPackage)));
    if(r.action==='list')return jsonResponse_(listJobs_(Boolean(r.includeDeleted)));
    if(r.action==='load')return jsonResponse_(loadJob_(r.id));
    if(r.action==='delete')return jsonResponse_(deleteJob_(r.id));
    if(r.action==='restore')return jsonResponse_(restoreJob_(r.id));
    if(r.action==='versions')return jsonResponse_(listVersions_(r.id));
    if(r.action==='loadVersion')return jsonResponse_(loadVersion_(r.fileId,r.id));throw new Error('Unknown action');
  }catch(x){return jsonResponse_({ok:false,error:x.message||String(x)});}
}
function saveJob_(job) {
  if(!job||!Array.isArray(job.parts))throw new Error('Invalid job data');const l=LockService.getScriptLock();l.waitLock(30000);
  try{const s=getSheet_(),n=new Date(),id=cleanText_(job.projectId||job.id||Utilities.getUuid(),100),row=findJobRowInSheet_(s,id),name=cleanText_(job.jobName||`Job ${n.toISOString()}`,200);assertUniqueJobName_(s,name,id);const oldRevision=row?Number(s.getRange(row,13).getValue()||1):0;if(row&&job.baseRevision&&Number(job.baseRevision)!==oldRevision)throw new Error('VERSION_CONFLICT: โปรเจกต์นี้ถูกแก้ไขจากอุปกรณ์อื่น กรุณา Load ใหม่');
    const created=row?s.getRange(row,2).getDisplayValue():(job.createdAt||n.toISOString());
    const data=Object.assign({},job,{id:id,projectId:id,jobName:name,createdAt:created,storage:'google-sheet-drive',updatedAt:n.toISOString(),revision:oldRevision+1});
    const filename=`${created.slice(0,10)}_${safeFilename_(name)}_${id.slice(0,8)}.json`,file=getFolder_().createFile(Utilities.newBlob(JSON.stringify(data),'application/json',filename)),values=buildJobRow_(data,file);
    if(row){appendVersion_(s,row);s.getRange(row,1,1,values.length).setValues([values]);}
    else s.appendRow(values);return{ok:true,id:id,projectId:id,updated:Boolean(row),revision:data.revision,fileUrl:file.getUrl()};
  }finally{l.releaseLock();}
}
function buildJobRow_(d,f) {
  const r=d.result||{},p=d.production||{};return[d.projectId,d.createdAt,d.updatedAt,safeSheetText_(d.jobName),Number(r.partCount||0),Number(r.sheetCount||0),cleanText_(r.usedPercent||'',30),'ACTIVE',f.getId(),f.getUrl(),safeSheetText_(p.material||''),Number(p.thickness||0),Number(d.revision||1),safeSheetText_(p.operatorName||''),safeSheetText_(p.orderCode||''),safeSheetText_(p.customer||''),cleanText_(p.dueDate||'',30)];
}
function assertUniqueJobName_(s,name,id) {
  const last=s.getLastRow();if(last<2)return;const rows=s.getRange(2,1,last-1,8).getDisplayValues(),key=normalizeJobName_(name);
  if(rows.some(r=>r[7]==='ACTIVE'&&r[0]!==id&&normalizeJobName_(r[3])===key))throw new Error(`DUPLICATE_JOB_NAME: มีงานชื่อ "${name}" อยู่แล้ว`);
}
function listJobs_(includeDeleted) {
  const s=getSheet_(),h=getHeaders_(),last=s.getLastRow();if(last<2)return{ok:true,jobs:[]};
  const jobs=s.getRange(2,1,last-1,h.length).getDisplayValues().filter(r=>includeDeleted||r[7]==='ACTIVE').map(r=>({id:r[0],projectId:r[0],createdAt:r[1],updatedAt:r[2],jobName:r[3],partCount:Number(r[4]||0),sheetCount:Number(r[5]||0),usedPercent:r[6],status:r[7],fileUrl:r[9],material:r[10]||'',thicknessMm:Number(r[11]||0),revision:Number(r[12]||1),updatedBy:r[13]||'',orderCode:r[14]||'',customer:r[15]||'',dueDate:r[16]||''}));
  jobs.sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));return{ok:true,jobs:jobs};
}
function loadJob_(id) {
  const s=getSheet_(),row=findJobRowInSheet_(s,id);if(!row)throw new Error('Job not found');const fileId=s.getRange(row,9).getDisplayValue(),job=JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8'));job.id=id;job.projectId=id;return{ok:true,job:job};
}
function deleteJob_(id) {
  const l=LockService.getScriptLock();l.waitLock(30000);try{const s=getSheet_(),row=findJobRowInSheet_(s,id);if(!row)throw new Error('Job not found');s.getRange(row,8).setValue('DELETED');s.getRange(row,3).setValue(new Date().toISOString());return{ok:true,id:id};}finally{l.releaseLock();}
}
function restoreJob_(id){const s=getSheet_(),row=findJobRowInSheet_(s,id);if(!row)throw new Error('Job not found');s.getRange(row,8).setValue('ACTIVE');s.getRange(row,3).setValue(new Date().toISOString());return{ok:true,id:id};}
function getVersionsSheet_(){const b=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));let s=b.getSheetByName('Versions');const h=['projectId','revision','savedAt','jobName','fileId','fileUrl','updatedBy'];if(!s){s=b.insertSheet('Versions');s.appendRow(h);}return s;}
function appendVersion_(s,row){const v=getVersionsSheet_(),r=s.getRange(row,1,1,getHeaders_().length).getDisplayValues()[0];if(r[8])v.appendRow([r[0],Number(r[12]||1),r[2],safeSheetText_(r[3]),r[8],r[9],safeSheetText_(r[13]||'')]);}
function listVersions_(id){const s=getVersionsSheet_(),last=s.getLastRow();if(last<2)return{ok:true,versions:[]};const v=s.getRange(2,1,last-1,7).getDisplayValues().filter(r=>r[0]===id).map(r=>({projectId:r[0],revision:Number(r[1]),savedAt:r[2],jobName:r[3],fileId:r[4],fileUrl:r[5],updatedBy:r[6]})).sort((a,b)=>b.revision-a.revision);return{ok:true,versions:v};}
function loadVersion_(fileId,id){if(!fileId)throw new Error('Missing version file');const job=JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8')),s=getSheet_(),row=findJobRowInSheet_(s,id),old=job.revision;job.id=id;job.projectId=id;job.restoredFromRevision=old;job.revision=row?Number(s.getRange(row,13).getValue()||1):old;return{ok:true,job:job};}
function findJobRowInSheet_(s,id) {
  if(!id||s.getLastRow()<2)return 0;const rows=s.getRange(2,1,s.getLastRow()-1,1).getDisplayValues(),i=rows.findIndex(r=>r[0]===id);return i<0?0:i+2;
}
function getSheet_() {
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),b=SpreadsheetApp.openById(id),h=getHeaders_();let s=b.getSheetByName('Jobs');if(!s)s=b.insertSheet('Jobs');if(s.getLastRow()===0)s.appendRow(h);else s.getRange(1,1,1,h.length).setValues([h]);s.setFrozenRows(1);return s;
}
function getFolder_(){return DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));}
function decodeJobPackage_(p){if(!p||!p.data)throw new Error('Missing job package');if(p.encoding==='json')return JSON.parse(p.data);if(p.encoding==='gzip-base64'){const b=Utilities.newBlob(Utilities.base64Decode(p.data),'application/gzip'),text=Utilities.ungzip(b).getDataAsString('UTF-8');return JSON.parse(text);}throw new Error('Unsupported job encoding');}
function assertConfigured_(){const p=PropertiesService.getScriptProperties();if(!p.getProperty('SPREADSHEET_ID')||!p.getProperty('DRIVE_FOLDER_ID'))throw new Error('Run setupNiceNesting() once before deploying');}
function assertSecret_(s){const k=PropertiesService.getScriptProperties().getProperty('API_SECRET');if(!k||s!==k)throw new Error('Invalid connection secret');}
function normalizeJobName_(v){return cleanText_(v,200).toLocaleLowerCase().replace(/\s+/g,' ');}
function safeSheetText_(v){const t=cleanText_(v,200);return/^[=+\-@]/.test(t)?`'${t}`:t;}
function safeFilename_(v){return cleanText_(v,80).replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_');}
function cleanText_(v,n){return String(v==null?'':v).trim().slice(0,n);}
function jsonResponse_(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);}
