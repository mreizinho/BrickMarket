const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const context = vm.createContext({ console, crypto, document: { addEventListener() {} }, window: { addEventListener() {} } });
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8')
  .replace(/writeAppHistory\("home", true\);\s*restoreSession\(\);\s*$/, '');
vm.runInContext(source, context);
const run = code => vm.runInContext(code, context);
run(`
  state.accessToken = 'test'; state.userEmail = 'test@example.com';
  const stock = [['100', '', '', '', '', '', '', 'A', 3], ['100', '', '', '', '', '', '', 'B', 2], ['200', '', '', '', '', '', '', 'A', 4]];
  const items = [{code:'100', qty:4, allocations:{A:2,B:2}}, {code:'200', qty:1, allocations:{A:1}}];
  const form = {storage:'C',obs:'Teste'};
  const rows = transferRows(items,form,stock,'transfer-1','timestamp','user');
`);
assert.equal(run('rows.length'), 6);
assert.equal(run('rows.reduce((n,row)=>n+row[11],0)'), 0);
assert.equal(run('rows.filter(row=>row[10]==="C").reduce((n,row)=>n+row[11],0)'), 5);
assert.equal(run('new Set(rows.map(row=>row[0])).size'), 6);
assert.ok(run('rows.every(row=>row[15]==="transfer-1")'));
for (let i = 0; i < 6; i += 2) {
  assert.ok(run(`rows[${i}][3] === rows[${i+1}][3] && rows[${i}][11] === -rows[${i+1}][11]`));
}
for (const storage of ['A', ' a ', '']) {
  assert.throws(() => run(`transferRows(items,{storage:${JSON.stringify(storage)}},stock,'id','time','user')`), /TRANSFER_DESTINATION/);
}
assert.throws(() => run(`transferRows([{code:'100',qty:4,allocations:{A:4}}],form,stock,'id','time','user')`), /LOCATION_STOCK_CHANGED/);
assert.throws(() => run(`transferRows([{code:'100',qty:2,allocations:{A:1}}],form,stock,'id','time','user')`), /INVALID_ALLOCATION/);
assert.throws(() => run(`transferRows([{code:'100',qty:1.5,allocations:{A:1.5}}],form,stock,'id','time','user')`), /INVALID_ALLOCATION/);
assert.throws(() => run(`transferRows([{code:'100',qty:2,allocations:{A:2}},{code:'100',qty:2,allocations:{A:2}}],form,stock,'id','time','user')`), /LOCATION_STOCK_CHANGED/);
assert.ok(run('movementsMarkup().includes(\'data-mode="transferencia"\')'));
assert.ok(run('batchTypeMarkup().includes(\'data-batch-type="transferencia"\')'));
run(`state.mode='transferencia';state.selected=items[0];state.locationStock=[{storage:'A',stock:3}];state.movementForm={...emptyMovementForm(),allocations:{A:1}};`);
assert.ok(run('foundMarkup().includes("Localização de destino") && foundMarkup().includes("data-allocation-storage")'));
assert.ok(!run('foundMarkup().includes(\'data-movement-field="origin"\')'));
run(`state.mode='lote';state.batch.movementType='transferencia';state.batch.items=items;`);
assert.ok(run('batchConditionsMarkup().includes("Localização de destino")'));
assert.ok(!run('batchConditionsMarkup().includes(\'data-batch-field="origin"\')'));
(async () => {
  run(`let requests=[]; ensureBatchColumnAndCheckDuplicate=async()=>false; loadMovementStockRows=async()=>stock;
    fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,json:async()=>({})}};`);
  await run(`appendTransferMovements(items,form,'id')`);
  assert.equal(run('requests.length'), 1);
  assert.equal(run('requests[0].body.values.length'), 6);
  run('ensureBatchColumnAndCheckDuplicate=async()=>true');
  assert.equal((await run(`appendTransferMovements(items,form,'id')`)).duplicate, true);
  assert.equal(run('requests.length'), 1);
  run('ensureBatchColumnAndCheckDuplicate=async()=>false');
  await assert.rejects(run(`appendTransferMovements(items,{storage:'A'},'id')`), /TRANSFER_DESTINATION/);
  assert.equal(run('requests.length'), 1);
  run(`state.mode='transferencia';state.selected=items[0];state.movementForm={...form,qty:4,allocations:{A:2,B:2}}`);
  await run('appendMovement()');
  assert.equal(run('requests[1].body.values.length'), 4);
  assert.ok(run('Boolean(state.movementForm.transferId)'));
  run(`state.mode='lote';state.batch={...emptyBatchState(),movementType:'transferencia',items,form}`);
  await run('appendBatchMovements()');
  assert.equal(run('requests[2].body.values.length'), 6);
  run(`state.mode='entrada';state.selected=items[0];state.movementForm={...emptyMovementForm(),storage:'C',origin:'Compra',qty:2}`);
  await run('appendMovement()');
  assert.equal(run('requests[3].body.values.length'), 1);
  assert.equal(run('requests[3].body.values[0][11]'), 2);
  run(`state.mode='saida';state.movementForm={...emptyMovementForm(),origin:'Outro',qty:2,allocations:{A:2}}`);
  await run('appendMovement()');
  assert.equal(run('requests[4].body.values.length'), 1);
  assert.equal(run('requests[4].body.values[0][11]'), -2);
  run(`state.accessToken=''`);
  await assert.rejects(run(`appendTransferMovements(items,form,'id')`), /NOT_AUTHENTICATED/);
  console.log('Transfer tests passed: balanced pairs, validation, menus, single/batch save, duplicate retry and authentication.');
})().catch(error => { console.error(error); process.exitCode=1; });
