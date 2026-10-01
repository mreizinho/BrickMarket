const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({console, document:{addEventListener(){},querySelector(){return null}},window:{addEventListener(){}}});
const source = fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8')
  .replace(/writeAppHistory\("home", true\);\s*restoreSession\(\);\s*$/, '');
vm.runInContext(source,context);
const run = code => vm.runInContext(code,context);
run(`render=()=>{};writeAppHistory=()=>{};isCurrentHistoryStep=()=>true;showMovementNotice=()=>{};
  state.loggedIn=true;state.accessToken='test';state.userEmail='editor@example.com';state.mode='entrada';
  let exists=false, rows=[], requests=[], deny=false;
  fetch=async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;requests.push({url,body});
    if(deny)return {status:403,ok:false,json:async()=>({})};
    if(url.includes('?fields='))return {status:200,ok:true,json:async()=>({sheets:exists?[{properties:{title:CUSTOM_ARTICLES_SHEET}}]:[]})};
    if(url.endsWith(':batchUpdate')){exists=true;rows=[CUSTOM_ARTICLES_HEADERS];}
    else if(url.includes(':append'))rows.push(...body.values);
    return {status:200,ok:true,json:async()=>({values:rows})};
  };
`);
(async()=>{
  assert.equal(run("offerCustomArticle('123')"),false);
  assert.equal(run("offerCustomArticle('4006381333931')"),true);
  assert.equal(run('state.customArticle.stage'),'confirm');
  run("state.customArticle.stage='form';state.customArticle.name='=Custom item';state.customArticle.theme='Own theme';state.customArticle.pieces='12';");
  await run('saveCustomArticle()');
  assert.equal(run('rows.length'),2);
  assert.equal(run('state.selected.code'),'CUSTOM-4006381333931');
  assert.equal(run('state.selected.name'),'=Custom item');
  assert.equal(run('state.selected.pieces'),12);
  assert.ok(run("requests.every(request=>!request.url.includes('BricksetDB'))"));
  assert.ok(run("requests.find(request=>request.url.includes(':append')).url.includes('valueInputOption=RAW')"));
  // Reload and Brickset refresh preserve the separate custom catalogue.
  run('state.customItems=[];state.catalogRows=[[],[]];');
  const loaded = await run('loadCustomArticles(state.accessToken)');
  context.loaded=loaded;
  run('state.customItems=loaded;');
  assert.equal(run("findSet('CUSTOM-4006381333931').ean"),'4006381333931');
  assert.equal(run("findSetByEan('4006381333931').name"),'=Custom item');
  // Retrying a save must reuse a previously committed EAN.
  run("offerCustomArticle('4006381333931');state.customArticle.name='Second name';");
  await run('saveCustomArticle()');
  assert.equal(run('rows.length'),2);
  // Missing login and write permissions leave the form open without a movement.
  run("offerCustomArticle('96385074');state.customArticle.name='Next item';state.loggedIn=false;");
  await run('saveCustomArticle()');
  assert.match(run('state.customArticle.error'),/sessão Google/);
  run('state.loggedIn=true;deny=true;');
  await run('saveCustomArticle()');
  assert.match(run('state.customArticle.error'),/Editor/);
  assert.equal(run('state.customArticle.saving'),false);
  assert.equal(run('rows.length'),2);
  run("deny=false;state.mode='lote';state.batch=emptyBatchState();state.batch.movementType='entrada';persistBatchDraft=()=>{};");
  await run('saveCustomArticle()');
  assert.equal(run('rows.length'),3);
  assert.equal(run('state.batch.items.length'),1);
  assert.equal(run('state.batch.items[0].code'),'CUSTOM-96385074');
  assert.equal(run('state.batch.items[0].qty'),1);
  console.log('Custom article tests passed: missing EAN prompt, isolated sheet, reload, RAW values, retry and permission failures.');
})().catch(error=>{console.error(error);process.exitCode=1});
