import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPortalSearchRecords, searchPortalRecords } from '../src/portalGlobalSearch.js';
import { dashboardRoute } from '../src/portalRouting.js';
import { copy } from '../src/i18n.js';
import { demoSession } from '../src/demoData.js';

const read = path => readFileSync(new URL('../' + path,import.meta.url),'utf8');
const cars = [
  { id:'v-1', registration:'KL10AB1234', model:'Swift', year:'2024' },
  { id:'v-2', registration:'KL10CD5678', model:'BMW iX' },
];
const session = {
  vehicles:cars,
  jobs:[
    {id:'j-1',vehicleId:'v-1',number:'JC-2026-001',status:'In Progress',stage:'work_in_progress'},
    {id:'j-2',vehicleId:'v-2',number:'JC-2026-002',status:'Delivered',stage:'delivered'},
    // Records for vehicles not in this signed-in session must never appear.
    {id:'j-private',vehicleId:'v-secret',number:'PRIVATE-001',status:'In Progress'},
  ],
  invoices:[
    {id:'i-1',jobId:'j-1',number:'INV-1001',status:'Unpaid'},
    {id:'i-private',jobId:'j-private',number:'PRIVATE-INVOICE-88'},
  ],
  estimates:[
    {id:'e-1',jobId:'j-1',version:2,status:'Awaiting Customer'},
    {id:'e-private',jobId:'j-private',version:1,status:'PRIVATE-ESTIMATE'},
  ],
};

test('global search indexes vehicle, active job, delivered job, estimate and invoice records',()=>{
  const rows=buildPortalSearchRecords(session);
  assert.equal(rows.filter(x=>x.kind==='vehicle').length,2);
  assert.equal(rows.filter(x=>x.kind==='job').length,2);
  assert.equal(rows.filter(x=>x.kind==='invoice').length,1);
  assert.equal(rows.filter(x=>x.kind==='estimate').length,1);
  assert.deepEqual(searchPortalRecords(rows,'kl10ab').map(x=>x.kind).includes('vehicle'),true);
  assert.equal(searchPortalRecords(rows,'jc-2026-001').some(x=>x.kind==='job'),true);
  assert.equal(searchPortalRecords(rows,'inv-1001')[0].section,'documents');
  assert.equal(searchPortalRecords(rows,'estimate')[0].section,'documents');
  assert.equal(searchPortalRecords(rows,'jc-2026-002')[0].section,'history');
  assert.equal(searchPortalRecords(rows,'jc-2026-001')[0].section,'maintenance');
  assert.equal(searchPortalRecords(rows,'bmw')[0].vehicleId,'v-2');
});

test('private or unrelated vehicles, jobs and documents are never searchable',()=>{
  const rows=buildPortalSearchRecords(session);
  assert.equal(rows.some(x=>String(x.key).includes('private')),false);
  assert.equal(searchPortalRecords(rows,'private').length,0);
  assert.deepEqual(rows.map(x=>x.vehicleId).every(id=>cars.some(v=>v.id===id)),true);
  assert.equal(searchPortalRecords(buildPortalSearchRecords({}),'KL10').length,0);
  assert.equal(searchPortalRecords(buildPortalSearchRecords({vehicles:cars}),'INVOICE').length,0);
});

test('search is bounded, case insensitive and leaves blank input closed',()=>{
  const rows=buildPortalSearchRecords(session);
  assert.equal(searchPortalRecords(rows,'').length,0);
  assert.equal(searchPortalRecords(rows,'   ').length,0);
  assert.equal(searchPortalRecords(rows,'KL10').filter(x=>x.kind==='vehicle').length,2);
  assert.equal(searchPortalRecords(rows,'kl10',1).length,1);
  assert.equal(searchPortalRecords(rows,'SWIFT')[0].kind,'vehicle');
  assert.ok(searchPortalRecords(buildPortalSearchRecords(demoSession),'DEMO').length>0);
});

test('header search only mounts with authenticated session and routes to allowed vehicle',()=>{
  const app=read('src/App.jsx'), ui=read('src/components/PortalGlobalSearch.jsx');
  assert.match(app,/session=\{state==='dashboard'\?data:null\}/);
  assert.match(app,/session&&<PortalGlobalSearch session=\{session\}/);
  assert.match(app,/onVehicleOpen=\{openVehicle\}/);
  assert.match(app,/const allowed=data\?\.vehicles\?\.find/);
  assert.match(app,/\['overview','maintenance','documents','history'\]\.includes\(section\)/);
  assert.match(app,/document\.getElementById\(target\)\?\.scrollIntoView/);
  assert.doesNotMatch(ui,/t\\.globalSearch(?!Placeholder)/);
  assert.doesNotMatch(ui,/<label[^>]*htmlFor="portal-global-search-input"/);
  assert.match(ui,/aria-label=\\{t\\.globalSearchPlaceholder\\}/);
  assert.match(ui,/buildPortalSearchRecords\(session\)/);
  assert.match(ui,/searchPortalRecords\(entries, query\)/);
  assert.match(ui,/event\.key === 'Enter'/);
  assert.match(ui,/event\.key === 'Escape'/);
  assert.match(ui,/event\.ctrlKey \|\| event\.metaKey/);
  assert.doesNotMatch(ui, /localStorage|fetch\(|type="file"|<ArrowRight/);
});

test('single vehicle stays direct while multiple vehicles have home breadcrumb and back button',()=>{
  const app=read('src/App.jsx');
  assert.equal(dashboardRoute([{id:'v-1'}],'/').kind,'vehicle');
  assert.equal(dashboardRoute(cars,'/').kind,'home');
  assert.match(app,/vehicles\.length>1 && <div className="portal-vehicle-navigation"/);
  assert.match(app,/aria-label=\{t\.breadcrumbLabel\}/);
  assert.match(app,/aria-current="page"/);
  assert.match(app,/onClick=\{onHome\}/);
  assert.match(app,/onClick=\{onHome\}>\{t\.backToHome\}/);
});

test('mobile header places search beneath workshop name and actions',()=>{
  const css=read('src/portalSearch.css');
  const layout=read('app/layout.jsx');
  assert.match(layout,/import '\.\.\/src\/portalSearch\.css'/);
  assert.match(css,/\.portal-has-search \.nav\{/);
  assert.match(css,/grid-column:1\/-1;grid-row:2/);
  assert.match(css,/@media\(max-width:910px\)/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/font-size:16px/);
  assert.match(css,/\.portal-global-search-dropdown\{/);
  assert.match(css,/\.portal-vehicle-breadcrumb\{/);
});

test('search and breadcrumb language labels available in English and Malayalam',()=>{
  for(const lang of ['en','ml']) for(const key of [
    'globalSearchPlaceholder','clearSearch','searchResults','searchMatches',
    'noSearchResults','searchTypeVehicle','searchTypeJob','searchTypeInvoice',
    'searchTypeEstimate','breadcrumbLabel',
  ]) assert.ok(copy[lang][key],lang+'.'+key);
});
