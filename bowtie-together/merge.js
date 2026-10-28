'use strict';
(function(root){

/* Bowtie Together v1.1 - ID-based optimistic concurrency; mirrored in public/merge.js. */
const crypto = null;
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode(){const b=new Uint8Array(16);globalThis.crypto.getRandomValues(b);return Array.from(b, v=>CODE_CHARS[v % CODE_CHARS.length]).join('');}
const validCode = value => typeof value==='string' && /^[A-HJ-NP-Z2-9]{16}$/.test(value);
const validId=v=>typeof v==='string'&&v.length>0&&v.length<=120&&!['__proto__','prototype','constructor'].includes(v);
const MAX_BYTES=900000;
function validProject(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||!validId(p.id)||!p.hazard||!p.topEvent||!Array.isArray(p.threats)||!Array.isArray(p.consequences))return false;
 try {
  const json=JSON.stringify(p);if(json.length>MAX_BYTES)return false;
  const checkSafe=(o,depth=0)=>{
   if(depth>16)throw Error('Too deep');
   if(o&&typeof o==='object'){
    if(Object.keys(o).some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Unsafe key');
    for(const v of Object.values(o))checkSafe(v,depth+1);
   }else if(typeof o==='number'&&!Number.isFinite(o))throw Error('Invalid number');
  };checkSafe(p);
  const checkList=(items,child)=>{
   if(!Array.isArray(items)||items.length>80)throw Error('Too many items');
   const ids=new Set();for(const item of items){
    if(!item||typeof item!=='object'||Array.isArray(item)||!validId(item.id)||ids.has(item.id))throw Error('Duplicate or invalid ID');ids.add(item.id);
    if(typeof item.title!=='string'||item.title.length>400||typeof item.description!=='string'||item.description.length>4000)throw Error('Invalid text');
    if(child==='barriers')checkList(item.barriers,'escalationFactors');
    if(child==='escalationFactors')checkList(item.escalationFactors,'controls');
    if(child==='controls')checkList(item.controls,null);
   }
  };
  if(typeof p.title!=='string'||p.title.length>400)throw Error('Title too long');
  if(typeof p.hazard.title!=='string'||typeof p.topEvent.title!=='string')throw Error('Invalid top-level fields');
  checkList(p.threats,'barriers');checkList(p.consequences,'barriers');
  return true;
 }catch{return false;}
}
const allowed={
 project:new Set(['title','subtitle','owner','version','riskBands']),
 hazard:new Set(['title','description']),topEvent:new Set(['title','description']),
 path:new Set(['title','description','risk.initial','risk.residual','risk.rationale']),
 barrier:new Set(['title','description','owner','status']),
 factor:new Set(['title','description']),control:new Set(['title','description','owner','status'])
};
function getPathValue(target,field){return field.split('.').reduce((v,k)=>v?.[k],target);}
function setPathValue(target,field,value){const parts=field.split('.');let obj=target;for(let i=0;i<parts.length-1;i++){if(!obj[parts[i]]||typeof obj[parts[i]]!=='object')obj[parts[i]]={};obj=obj[parts[i]];}obj[parts.at(-1)]=clone(value);}
function collection(p,op){
 const list=op.kind==='threat'?p.threats:op.kind==='consequence'?p.consequences:null;
 if(!list)return null;if(op.level==='path')return list;
 const path=list.find(x=>x.id===op.pathId);if(!path)return null;
 if(op.level==='barrier')return path.barriers;
 const barrier=path.barriers?.find(x=>x.id===op.barrierId);if(!barrier)return null;
 if(op.level==='factor')return barrier.escalationFactors;
 const factor=barrier.escalationFactors?.find(x=>x.id===op.factorId);if(!factor)return null;
 if(op.level==='control')return factor.controls;
 return null;
}
class ConflictError extends Error {constructor(conflicts){super('Concurrent edits need review');this.name='ConflictError';this.status=409;this.conflicts=conflicts;}}
function applyOps(project,ops,options={}){
 if(!Array.isArray(ops)||ops.length>500)throw Error('Invalid changes');
 const output=clone(project),conflicts=[];
 const bad=(i,op,reason)=>conflicts.push({index:i,level:op.level||'',kind:op.kind||'',id:op.id||'',field:op.field||'',reason});
 for(const [index,op] of ops.entries()){
  if(!op||typeof op!=='object'||!['set','add','delete'].includes(op.action))throw Error('Invalid operation');
  let arr=null,idx=-1,target;
  if(['project','hazard','topEvent'].includes(op.level)){
   if(op.action!=='set'||!allowed[op.level].has(op.field))throw Error('Invalid top-level edit');
   target=op.level==='project'?output:output[op.level];
  }else{
   if(!['threat','consequence'].includes(op.kind)||!['path','barrier','factor','control'].includes(op.level)||!validId(op.id))throw Error('Invalid element reference');
   arr=collection(output,op);
   if(!Array.isArray(arr)){bad(index,op,'parent_removed');continue;}
   idx=arr.findIndex(x=>x.id===op.id);target=idx<0?null:arr[idx];
   if(op.action==='set'&&!allowed[op.level].has(op.field))throw Error('Invalid field');
  }
  if(op.action==='set'){
   if(!target){bad(index,op,'removed');continue;}
   const current=getPathValue(target,op.field);
   if(options.requirePreconditions&&!Object.hasOwn(op,'before'))throw Error('Missing edit precondition');
   if(Object.hasOwn(op,'before')&&!options.force&&!equal(op.before,current)&&!equal(op.value,current)) {bad(index,op,'modified');continue;}
   if(!equal(op.value,current))setPathValue(target,op.field,op.value);
  }else if(op.action==='delete'){
   if(idx<0)continue; // Deleting the same item twice is safe.
   if(options.requirePreconditions&&!Object.hasOwn(op,'before'))throw Error('Missing delete precondition');
   if(Object.hasOwn(op,'before')&&!options.force&&!equal(op.before,target)){bad(index,op,'modified');continue;}
   arr.splice(idx,1);
  }else if(op.action==='add'){
   if(!op.value||op.id!==op.value.id)throw Error('Invalid added element');
   if(idx>=0){if(!equal(target,op.value))bad(index,op,'already_exists');continue;}
   arr.push(clone(op.value));
  }
 }
 if(conflicts.length)throw new ConflictError(conflicts);
 if(!validProject(output))throw Error('Invalid project structure or size');
 return output;
}
function diffProject(oldProject,newProject){
 const ops=[];
 const top=(level,oldItem,newItem)=>{
  for(const field of allowed[level]){
   const before=getPathValue(oldItem,field),value=getPathValue(newItem,field);
   if(!equal(before,value))ops.push({action:'set',level,field,before:clone(before??null),value:clone(value??null)});
  }
 };
 top('project',oldProject,newProject);top('hazard',oldProject.hazard,newProject.hazard);top('topEvent',oldProject.topEvent,newProject.topEvent);
 for(const [kind,key] of [['threat','threats'],['consequence','consequences']]){
  const walk=(level,oldList,newList,location)=>{
   const oldMap=new Map((oldList||[]).map(x=>[x.id,x]));const newMap=new Map((newList||[]).map(x=>[x.id,x]));
   for(const oldObj of oldList||[])if(!newMap.has(oldObj.id))ops.push({action:'delete',kind,level,...location,id:oldObj.id,before:clone(oldObj)});
   for(const newObj of newList||[]){
    const oldObj=oldMap.get(newObj.id);
    if(!oldObj){ops.push({action:'add',kind,level,...location,id:newObj.id,value:clone(newObj)});continue;}
    for(const field of allowed[level]){
     const before=getPathValue(oldObj,field),value=getPathValue(newObj,field);
     if(!equal(before,value))ops.push({action:'set',kind,level,...location,id:newObj.id,field,before:clone(before??null),value:clone(value??null)});
    }
    if(level==='path')walk('barrier',oldObj.barriers,newObj.barriers,{pathId:newObj.id});
    if(level==='barrier')walk('factor',oldObj.escalationFactors,newObj.escalationFactors,{...location,barrierId:newObj.id});
    if(level==='factor')walk('control',oldObj.controls,newObj.controls,{...location,factorId:newObj.id});
   }
  };walk('path',oldProject[key],newProject[key],{});
 }
 return ops;
}
root.BowtieMerge={clone,newCode,validCode,validProject,applyOps,diffProject,ConflictError};

})(window);
