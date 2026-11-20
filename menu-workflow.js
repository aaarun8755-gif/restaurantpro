/* RestaurantPro Menu Approval Workflow — additive module; does not replace legacy sidebar/form handlers. */
(function () {
  'use strict';
  const outlet = () => localStorage.getItem('rpSelectedOutlet') || 'Main Outlet';
  const isHO = () => outlet() === 'Head Office';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const OUTLETS = ['Main Outlet','RestaurantPro - Andhra Pradesh','RestaurantPro - Arunachal Pradesh','RestaurantPro - Assam','RestaurantPro - Bihar','RestaurantPro - Chhattisgarh','RestaurantPro - Goa','RestaurantPro - Gujarat','RestaurantPro - Haryana','RestaurantPro - Himachal Pradesh','RestaurantPro - Jharkhand','RestaurantPro - Karnataka','RestaurantPro - Kerala','RestaurantPro - Madhya Pradesh','RestaurantPro - Maharashtra','RestaurantPro - Manipur','RestaurantPro - Meghalaya','RestaurantPro - Mizoram','RestaurantPro - Nagaland','RestaurantPro - Noida','RestaurantPro - Odisha','RestaurantPro - Punjab','RestaurantPro - Rajasthan','RestaurantPro - Sikkim','RestaurantPro - Tamil Nadu','RestaurantPro - Telangana','RestaurantPro - Tripura','RestaurantPro - Uttar Pradesh','RestaurantPro - Uttarakhand','RestaurantPro - West Bengal','RestaurantPro - Delhi'];
  let requests = [];
  async function api(url, options={}) { const r=await fetch(url,{headers:{'Content-Type':'application/json'},...options}); const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||('Request failed: '+r.status)); return d; }
  function addControls() {
    const form=document.getElementById('addMenuForm'); if(!form || document.getElementById('rpMenuBarcode')) return;
    const fields=document.createElement('div'); fields.style.cssText='display:contents';
    fields.innerHTML=`
      <div class="menu-field"><label for="rpMenuBarcode">Barcode</label><input id="rpMenuBarcode" placeholder="Auto-generated barcode" readonly></div>
      <div class="menu-field"><label for="rpMenuDepartment">Category Two · Department</label><select id="rpMenuDepartment"><option>Restaurant</option><option>Retail</option><option>Sweet</option><option>Bakery</option><option>Namkeen</option></select></div>
      <div class="menu-field"><label for="rpMenuRecipeMode">Category Three · Recipe Mode</label><select id="rpMenuRecipeMode"><option>Manual Creatable</option><option>Self Creatable</option></select></div>
      <div class="menu-field"><label for="rpMenuVendor">Category Four · Vendor Category</label><select id="rpMenuVendor"><option value="">Select approved vendor</option></select></div>
      <div class="menu-field" id="rpSelfUnitWrap"><label for="rpMenuSelfUnit">Self Recipe Unit</label><select id="rpMenuSelfUnit"><option>1 Pc</option><option>1 Kg</option><option>1 Pkt</option></select></div>`;
    const anchor=document.getElementById('newItemPrice')?.closest('.menu-field'); if(anchor) anchor.after(fields);
    const name=document.getElementById('newItemName'), code=document.getElementById('newItemShortCode'), bar=document.getElementById('rpMenuBarcode');
    const gen=()=>{const n=(name.value||'ITEM').replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,7)||'ITEM';const c=(code.value||'001').replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,8)||'001';bar.value='890'+n+c;};
    name.addEventListener('input',gen); code.addEventListener('input',gen); gen();
    const mode=document.getElementById('rpMenuRecipeMode'),selfCheck=document.getElementById('newItemRecipe');const syncMode=()=>{if(selfCheck)selfCheck.checked=mode.value==='Self Creatable';document.getElementById('rpSelfUnitWrap').style.display=mode.value==='Self Creatable'?'':'none'};mode.addEventListener('change',syncMode);if(selfCheck)selfCheck.addEventListener('change',()=>{mode.value=selfCheck.checked?'Self Creatable':'Manual Creatable';syncMode()});syncMode();
    loadVendors();
    const label=document.querySelector('.menu-sync-label'); if(label) label.textContent='● Head Office approval workflow';
  }
  async function loadVendors(){const sel=document.getElementById('rpMenuVendor');if(!sel)return;try{const arr=JSON.parse(localStorage.getItem('rpSuppliers')||'[]');const approved=arr.filter(x=>String(x.status||'Approved').toLowerCase()==='approved');sel.innerHTML='<option value="">Select approved vendor</option>'+approved.map(x=>`<option>${esc(x.name||x.company||'Vendor')}</option>`).join('')}catch(_){}}
  async function loadCategories(){const sel=document.getElementById('newItemCategory');if(!sel)return;try{const names=await api('/api/menu/categories');for(const name of names){if(![...sel.options].some(o=>o.value===name)){const op=document.createElement('option');op.value=name;op.textContent=name;sel.insertBefore(op,sel.querySelector('option[value="__other"]')||null)}}}catch(_){}}
  function ensurePanel(){const page=document.getElementById('menuPage');if(!page||document.getElementById('rpMenuApprovalPanel'))return;const panel=document.createElement('section');panel.id='rpMenuApprovalPanel';panel.className='panel';panel.style.marginTop='16px';panel.innerHTML='<div class="panel-head"><h2>Head Office Menu Approval Queue</h2><button class="btn light small" type="button" id="rpMenuRefresh">Refresh</button></div><div id="rpMenuRequests">Loading requests…</div><div style="margin-top:20px"><h3>Generated Barcode Ledger</h3><div id="rpMenuBarcodeLedger">Loading barcodes…</div></div>';const target=document.getElementById('menuVariationsPanel');(target||page).after(panel);document.getElementById('rpMenuRefresh').addEventListener('click',loadRequests);}
  async function loadRequests(){const host=document.getElementById('rpMenuRequests');if(!host)return;try{requests=await api('/api/menu/approval-requests?outlet='+encodeURIComponent(outlet()));const pending=requests.filter(x=>x.status==='Pending');host.innerHTML=pending.length?`<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>Action</th><th>Item</th><th>Category / Dept</th><th>Price</th><th>Requested By</th><th>Date</th><th>Action</th></tr></thead><tbody>${pending.map(r=>`<tr><td>${esc(r.action)}</td><td><b>${esc(r.item.name)}</b><br><small>${esc(r.item.barcode||'')}</small></td><td>${esc(r.item.category||'')} / ${esc(r.item.department||'')}</td><td>₹${Number(r.item.price||0).toFixed(2)}</td><td>${esc(r.requestedBy)}</td><td>${new Date(r.requestedAt).toLocaleString()}</td><td>${isHO()?`<button class="btn small" data-rp-approve="${esc(r.reqId)}">Select Outlets & Approve</button> <button class="btn danger small" data-rp-reject="${esc(r.reqId)}">Reject</button>`:'Pending HO'}</td></tr>`).join('')}</tbody></table></div>`:'<p>No pending menu approval requests.</p>';host.querySelectorAll('[data-rp-approve]').forEach(b=>b.addEventListener('click',()=>approveDialog(b.dataset.rpApprove)));host.querySelectorAll('[data-rp-reject]').forEach(b=>b.addEventListener('click',()=>reject(b.dataset.rpReject)));loadBarcodeLedger();}catch(e){host.textContent='Approval queue load nahi hui: '+e.message}}
  async function loadBarcodeLedger(){const host=document.getElementById('rpMenuBarcodeLedger');if(!host)return;try{const rows=await api('/api/menu/barcodes');host.innerHTML=rows.length?'<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>Item</th><th>Short Code</th><th>Barcode</th><th>Price</th><th>Created</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.shortCode)+'</td><td><b>'+esc(x.barcode)+'</b></td><td>₹'+Number(x.price||0).toFixed(2)+'</td><td>'+new Date(x.createdAt).toLocaleString()+'</td></tr>').join('')+'</tbody></table></div>':'<p>No generated barcode records yet.</p>'}catch(e){host.textContent='Barcode ledger unavailable.'}}
  function approveDialog(id){const r=requests.find(x=>x.reqId===id);if(!r)return;const wrap=document.createElement('div');wrap.style.cssText='position:fixed;inset:0;background:#0008;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px';wrap.innerHTML=`<div style="background:#fff;border-radius:14px;padding:20px;width:min(650px,96vw);max-height:85vh;overflow:auto"><h3>Approve ${esc(r.item.name)}</h3><p>Select only outlets that should receive this item.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">${OUTLETS.map(o=>`<label style="display:flex;gap:7px;align-items:center"><input type="checkbox" value="${esc(o)}"> ${esc(o.replace(/^RestaurantPro - /,''))}</label>`).join('')}</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn light" id="rpCancelApprove">Cancel</button><button class="btn" id="rpConfirmApprove">Approve Selected Outlets</button></div></div>`;document.body.appendChild(wrap);wrap.querySelector('#rpCancelApprove').onclick=()=>wrap.remove();wrap.querySelector('#rpConfirmApprove').onclick=async()=>{const outlets=[...wrap.querySelectorAll('input:checked')].map(x=>x.value);if(!outlets.length){alert('At least one outlet select karein.');return}try{await api('/api/menu/approval-requests/'+encodeURIComponent(id)+'/approve',{method:'POST',body:JSON.stringify({outlets})});wrap.remove();await loadRequests();await loadApprovedMenu();alert('Menu item selected outlets ke liye approve ho gaya.')}catch(e){alert(e.message)}};}
  async function reject(id){const reason=prompt('Reject reason (optional):')||'';try{await api('/api/menu/approval-requests/'+encodeURIComponent(id)+'/reject',{method:'POST',body:JSON.stringify({reason})});loadRequests()}catch(e){alert(e.message)}}
  async function loadApprovedMenu(){try{const rows=await api('/api/menu?outlet='+encodeURIComponent(outlet()));const deleted=await api('/api/menu/deletions?outlet='+encodeURIComponent(outlet())).catch(()=>[]);const deletedIds=new Set((deleted||[]).map(x=>String(x.id)));let current=JSON.parse(localStorage.getItem('rpMenuItems')||'[]');if(deletedIds.size)current=current.filter(x=>!deletedIds.has(String(x.id)));const normalized=rows.map(x=>({...x,id:Number(x.id)||x.id,category:x.category||x.cat1||'Other',price:Number(x.price||0)}));const local=current;const map=new Map(local.map(x=>[String(x.id),x]));normalized.forEach(x=>map.set(String(x.id),x));const merged=[...map.values()];localStorage.setItem('rpMenuItems',JSON.stringify(merged));if(typeof menuItems!=='undefined'){menuItems.splice(0,menuItems.length,...merged);if(typeof renderMenu==='function')renderMenu();if(typeof renderManageMenu==='function')renderManageMenu();}if(typeof inventoryItems!=='undefined'&&typeof saveInventory==='function'){let changed=false;for(const it of normalized.filter(x=>x.recipeMode==='Self Creatable'||x.selfCreate)){let mat=inventoryItems.find(x=>String(x.name).toLowerCase()===String(it.name).toLowerCase());if(!mat){const unit=String(it.selfUnit||'1 Pc');mat={id:Date.now()+Math.floor(Math.random()*1000),name:it.name,category:'Raw Material',unit:unit==='1 Kg'?'kg':unit==='1 Pkt'?'pkt':'pcs',stock:0,outlet:outlet()};inventoryItems.push(mat);changed=true;}let recs=[];try{recs=JSON.parse(localStorage.getItem('rpRecipes')||'[]')}catch(_){}if(!recs.some(r=>String(r.menuItemName||'').toLowerCase()===String(it.name).toLowerCase()||String(r.menuId)===String(it.id))){recs.push({menuId:it.id,menuItemName:it.name,note:'Auto-created self recipe: 1 '+String(it.selfUnit||'Pc'),ingredients:[{materialId:mat.id,qty:1}]});localStorage.setItem('rpRecipes',JSON.stringify(recs));}}if(changed)saveInventory();}}catch(e){console.warn('Approved menu sync:',e.message)}}
  function installFormRequest(){const form=document.getElementById('addMenuForm');if(!form||form.dataset.rpApprovalBound)return;form.dataset.rpApprovalBound='1';form.addEventListener('submit',async e=>{if(!e.defaultPrevented)return;/* legacy handler validates and prevents default; the submit listener below runs after it */},false);form.addEventListener('rp-menu-submit',()=>{});}
  // The legacy submit handler is intentionally not hijacked. It dispatches this event after validation below.
  document.addEventListener('rp:menu-submit-request',async e=>{try{const payload=e.detail;if(payload.category)await api('/api/menu/categories',{method:'POST',body:JSON.stringify({name:payload.category})});await api('/api/menu/approval-requests',{method:'POST',body:JSON.stringify({action:'ADD',requestedBy:outlet(),item:payload})});const fb=document.getElementById('menuFeedback');if(fb){fb.textContent='Menu item Head Office approval queue mein bhej diya gaya hai. Approval se pehle POS menu mein live nahi hoga.';fb.classList.remove('hidden')}loadRequests();}catch(err){alert('Menu approval request submit nahi hui: '+err.message)}});
  document.addEventListener('rp:menu-change-request',async e=>{try{const d=e.detail;await api('/api/menu/approval-requests',{method:'POST',body:JSON.stringify({action:d.action,requestedBy:outlet(),item:d.item})});loadRequests();}catch(err){alert('Change request submit nahi hui: '+err.message)}});
  document.addEventListener('DOMContentLoaded',()=>{addControls();ensurePanel();loadCategories();loadRequests();loadApprovedMenu();installFormRequest();});
  window.rpRefreshMenuApprovals=loadRequests;
})();


/* RP_TAB_CAPTURE_FIX */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button, a, [role="tab"]');
  if (!btn) return;
  const t = (btn.innerText || '').trim();
  if (t !== 'Items' && t !== 'Categories' && t !== 'Variants' && t !== 'Addons') return;

  const formCard = document.getElementById('addMenuForm')?.closest('.panel, section, div');
  const catP = document.getElementById('menuCategoriesPanel');
  const varP = document.getElementById('menuVariationsPanel');
  const itemsList = document.getElementById('manageMenuList')?.closest('.panel, section');
  if (!catP && !varP) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  btn.parentElement?.querySelectorAll('button, a').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (window.rpRefreshAllTabs) window.rpRefreshAllTabs();

  if (t === 'Items') {
    if (formCard) formCard.style.display = '';
    if (itemsList) itemsList.style.display = '';
    if (catP) catP.style.display = 'none';
    if (varP) varP.style.display = 'none';
  } else if (t === 'Categories') {
    if (formCard) formCard.style.display = 'none';
    if (itemsList) itemsList.style.display = 'none';
    if (catP) { catP.style.display = 'block'; catP.classList.remove('hidden'); }
    if (varP) varP.style.display = 'none';
  } else if (t === 'Variants' || t === 'Addons') {
    if (formCard) formCard.style.display = 'none';
    if (itemsList) itemsList.style.display = 'none';
    if (catP) catP.style.display = 'none';
    if (varP) { varP.style.display = 'block'; varP.classList.remove('hidden'); }
  }
}, true);


/* RP_TABS_ADDON */
(function(){
  const OUTS = ['Main Outlet','RestaurantPro - Andhra Pradesh','RestaurantPro - Arunachal Pradesh','RestaurantPro - Assam','RestaurantPro - Bihar','RestaurantPro - Chhattisgarh','RestaurantPro - Goa','RestaurantPro - Gujarat','RestaurantPro - Haryana','RestaurantPro - Himachal Pradesh','RestaurantPro - Jharkhand','RestaurantPro - Karnataka','RestaurantPro - Kerala','RestaurantPro - Madhya Pradesh','RestaurantPro - Maharashtra','RestaurantPro - Manipur','RestaurantPro - Meghalaya','RestaurantPro - Mizoram','RestaurantPro - Nagaland','RestaurantPro - Noida','RestaurantPro - Odisha','RestaurantPro - Punjab','RestaurantPro - Rajasthan','RestaurantPro - Sikkim','RestaurantPro - Tamil Nadu','RestaurantPro - Telangana','RestaurantPro - Tripura','RestaurantPro - Uttar Pradesh','RestaurantPro - Uttarakhand','RestaurantPro - West Bengal','RestaurantPro - Delhi'];
  const getOut = () => localStorage.getItem('rpSelectedOutlet') || 'Main Outlet';
  const isHO = () => getOut() === 'Head Office';
  const getCats = () => JSON.parse(localStorage.getItem('rpGroupedCats') || '[{"id":"gc1","cat1":"Ghee Sweet","cat2":"Sweet","cat3":"Self Creatable","vendor":"Central Warehouse","status":"Active"},{"id":"gc2","cat1":"Chena Sweet","cat2":"Sweet","cat3":"Self Creatable","vendor":"Central Warehouse","status":"Active"},{"id":"gc3","cat1":"Khoya Sweet","cat2":"Sweet","cat3":"Self Creatable","vendor":"Central Warehouse","status":"Active"},{"id":"gc4","cat1":"South Indian","cat2":"Restaurant","cat3":"Manual Creatable","vendor":"Arun Traders Vendor","status":"Active"}]');
  const getVars = () => JSON.parse(localStorage.getItem('rpTabVars') || '[{"id":"v1","name":"100gm","dept":"Quantity","status":"Active"},{"id":"v2","name":"250gm","dept":"Quantity","status":"Active"},{"id":"v3","name":"500gm","dept":"Quantity","status":"Active"},{"id":"v4","name":"1 Kg","dept":"Quantity","status":"Active"}]');
  const getAddons = () => JSON.parse(localStorage.getItem('rpTabAddons') || '[{"id":"a1","dept":"Choice Of Breads","display":"Choice Of Breads","price":30,"status":"Active"},{"id":"a2","dept":"Extra Chutney","display":"Extra Chutney","price":15,"status":"Active"},{"id":"a3","dept":"Extra Cheese","display":"Extra Cheese","price":40,"status":"Active"}]');
  const getReqs = () => JSON.parse(localStorage.getItem('rpCvaApprovalQueue') || '[]');

  window.rpSendCvaReq = (type, action, item) => {
    const q = getReqs(); q.unshift({ reqId: 'CVA-' + Date.now(), type, action, item, reqBy: getOut() });
    localStorage.setItem('rpCvaApprovalQueue', JSON.stringify(q));
    alert(action + ' request sent to Head Office Approval!');
    window.rpRefreshAllTabs();
  };
  window.rpOpenCvaHo = (reqId) => {
    const req = getReqs().find(x => x.reqId === reqId); if (!req) return;
    let m = document.getElementById('rpCvaHoModal');
    if (!m) { m = document.createElement('div'); m.id = 'rpCvaHoModal'; m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center'; document.body.appendChild(m); }
    m.style.display = 'flex';
    m.innerHTML = '<div style="background:#fff;padding:18px;border-radius:12px;max-width:560px;width:92%"><h3>HO Approval (' + req.type + '): ' + (req.item.cat1 || req.item.name || req.item.dept) + '</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-height:220px;overflow:auto;margin:10px 0">' + OUTS.map(o => '<label style="font-size:12px"><input type="checkbox" class="cva-ochk" value="' + o + '"> ' + o + '</label>').join('') + '</div><button type="button" data-r="' + reqId + '" onclick="rpExecCvaHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700">Approve &amp; Sync</button> <button type="button" onclick="rpCvaHoModal.style.display=\'none\'" style="padding:8px 12px">Cancel</button></div>';
  };
  window.rpExecCvaHo = (reqId) => {
    const q = getReqs(), idx = q.findIndex(x => x.reqId === reqId), req = q[idx];
    const sel = Array.from(document.querySelectorAll('.cva-ochk:checked')).map(c => c.value);
    const key = req.type === 'CATEGORY' ? 'rpGroupedCats' : (req.type === 'VARIANT' ? 'rpTabVars' : 'rpTabAddons');
    let list = req.type === 'CATEGORY' ? getCats() : (req.type === 'VARIANT' ? getVars() : getAddons());
    if (req.action === 'DELETE') list = list.filter(x => x.id !== req.item.id);
    else { req.item.outlets = sel; const i = list.findIndex(x => x.id === req.item.id); if (i >= 0) list[i] = req.item; else list.push(req.item); }
    localStorage.setItem(key, JSON.stringify(list)); q.splice(idx, 1); localStorage.setItem('rpCvaApprovalQueue', JSON.stringify(q));
    document.getElementById('rpCvaHoModal').style.display = 'none'; window.rpRefreshAllTabs();
  };
  window.rpExportCvaExcel = (type) => {
    const rows = type === 'CATEGORY' ? [['Vendor','Recipe Mode','Group','Cat 1'], ...getCats().map(c=>[c.vendor,c.cat3,c.cat2,c.cat1])] : type === 'VARIANT' ? [['Variant','Dept'], ...getVars().map(v=>[v.name,v.dept])] : [['Dept','Display','Price'], ...getAddons().map(a=>[a.dept,a.display,a.price])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'})); a.download = type + '.csv'; a.click();
  };

  window.rpRefreshAllTabs = () => {
    const q = getReqs();
    const apHtml = '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;margin-bottom:12px"><strong style="color:#b45309">Head Office Approval Requests: ' + q.length + '</strong>' + (q.length ? '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px"><tr style="background:#fef3c7"><th style="padding:5px;border:1px solid #cbd5e1">Tab</th><th style="padding:5px;border:1px solid #cbd5e1">Action</th><th style="padding:5px;border:1px solid #cbd5e1">Details</th><th style="padding:5px;border:1px solid #cbd5e1">By</th><th style="padding:5px;border:1px solid #cbd5e1">HO Action</th></tr>' + q.map(r=>'<tr><td style="padding:5px;border:1px solid #cbd5e1">'+r.type+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+r.action+'</td><td style="padding:5px;border:1px solid #cbd5e1"><b>'+(r.item.cat1 ? (r.item.vendor+' > '+r.item.cat3+' > '+r.item.cat2+' > '+r.item.cat1) : (r.item.name||r.item.dept))+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+r.reqBy+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+(isHO()?'<button type="button" data-r="'+r.reqId+'" onclick="rpOpenCvaHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:4px 8px;border-radius:5px">Approve</button>':'Pending HO')+'</td></tr>').join('') + '</table>' : '') + '</div>';
    const filt = l => l.filter(x => isHO() || !x.outlets || !x.outlets.length || x.outlets.includes(getOut()));
    const catP = document.getElementById('menuCategoriesPanel'), varP = document.getElementById('menuVariationsPanel');

    if (catP) {
      const cs = filt(getCats());
      catP.innerHTML = apHtml +
        '<div class="panel-head"><h2>Category Grouping (Vendor &gt; Self Create &gt; Group Cat 2 &gt; Cat 1)</h2><button type="button" onclick="rpExportCvaExcel(\'CATEGORY\')">Excel</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px">' +
          '<input id="gCat1" placeholder="1. Cat 1 (e.g. Ghee Sweet)" style="padding:6px">' +
          '<select id="gCat2" style="padding:6px"><option value="Sweet">2. Sweet</option><option value="Restaurant">2. Restaurant</option><option value="Retail">2. Retail</option></select>' +
          '<select id="gCat3" style="padding:6px"><option value="Self Creatable">3. Self Creatable</option><option value="Manual Creatable">3. Manual Creatable</option></select>' +
          '<select id="gVen" style="padding:6px"><option value="Central Warehouse">4. Central Warehouse</option><option value="Arun Traders Vendor">4. Arun Traders Vendor</option></select>' +
          '<button type="button" onclick="if(gCat1.value.trim())rpSendCvaReq(\'CATEGORY\',\'CREATE\',{id:\'gc-\'+Date.now(),cat1:gCat1.value.trim(),cat2:gCat2.value,cat3:gCat3.value,vendor:gVen.value})" style="background:#0f766e;color:#fff;border:0;padding:7px;border-radius:7px;font-weight:700">+ Create (HO)</button>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="background:#eef6f4"><th style="padding:6px;border:1px solid #cbd5e1">Grouping Hierarchy</th><th style="padding:6px;border:1px solid #cbd5e1">Actions</th></tr></thead><tbody>' +
        cs.map(c=>'<tr><td style="padding:6px;border:1px solid #cbd5e1;color:#0f766e"><b>'+c.vendor+' &gt; '+c.cat3+' &gt; '+c.cat2+' &gt; '+c.cat1+'</b></td><td style="padding:6px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+c.vendor+' > '+c.cat3+' > '+c.cat2+' > '+c.cat1+'\')">View</button> <button type="button" onclick="const nn=prompt(\'Edit Cat 1:\',\''+c.cat1+'\');if(nn)rpSendCvaReq(\'CATEGORY\',\'EDIT\',{id:\''+c.id+'\',cat1:nn,cat2:\''+c.cat2+'\',cat3:\''+c.cat3+'\',vendor:\''+c.vendor+'\'})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'CATEGORY\',\'DELETE\',{id:\''+c.id+'\',cat1:\''+c.cat1+'\'})">Delete</button></td></tr>').join('') + '</tbody></table>';
    }
    if (varP) {
      const vs = filt(getVars()), ads = filt(getAddons());
      varP.innerHTML = apHtml +
        '<div class="panel-head"><h2>Variants &amp; Addons (Create New -> HO Approval)</h2><div><button type="button" onclick="rpExportCvaExcel(\'VARIANT\')">Var Excel</button> <button type="button" onclick="rpExportCvaExcel(\'ADDON\')">Addon Excel</button></div></div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px"><input id="nVarN" placeholder="Variant (e.g. 250gm)"><button type="button" onclick="if(nVarN.value.trim())rpSendCvaReq(\'VARIANT\',\'CREATE\',{id:\'v-\'+Date.now(),name:nVarN.value.trim(),dept:\'Quantity\'})" style="background:#0f766e;color:#fff;border:0;padding:6px 12px;border-radius:6px">+ Variant</button></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:12px"><tbody>' + vs.map(v=>'<tr><td style="padding:6px;border:1px solid #cbd5e1"><b>'+v.name+'</b></td><td style="padding:6px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+v.name+'\')">View</button> <button type="button" onclick="const nn=prompt(\'Edit:\',\''+v.name+'\');if(nn)rpSendCvaReq(\'VARIANT\',\'EDIT\',{id:\''+v.id+'\',name:nn,dept:\'Quantity\'})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'VARIANT\',\'DELETE\',{id:\''+v.id+'\',name:\''+v.name+'\'})">Del</button></td></tr>').join('') + '</tbody></table>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px"><input id="nAdD" placeholder="Addon Name"><input id="nAdP" type="number" placeholder="Price" style="width:90px"><button type="button" onclick="if(nAdD.value.trim())rpSendCvaReq(\'ADDON\',\'CREATE\',{id:\'a-\'+Date.now(),dept:nAdD.value.trim(),display:nAdD.value.trim(),price:Number(nAdP.value||0)})" style="background:#0f766e;color:#fff;border:0;padding:6px 12px;border-radius:6px">+ Addon</button></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><tbody>' + ads.map(a=>'<tr><td style="padding:6px;border:1px solid #cbd5e1"><b>'+a.dept+'</b> (Rs.'+a.price+')</td><td style="padding:6px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+a.dept+'\')">View</button> <button type="button" onclick="const np=prompt(\'Price:\',\''+a.price+'\');if(np)rpSendCvaReq(\'ADDON\',\'EDIT\',{id:\''+a.id+'\',dept:\''+a.dept+'\',display:\''+a.display+'\',price:Number(np)})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'ADDON\',\'DELETE\',{id:\''+a.id+'\',dept:\''+a.dept+'\'})">Del</button></td></tr>').join('') + '</tbody></table>';
    }
  };
  setInterval(() => { document.querySelectorAll('div,span,p').forEach(el => { if ((el.innerText || '').includes('New QR Order')) { const b = el.closest('div[style*="fixed"],div[style*="sticky"],div[style*="border"]') || el.parentElement; if (b) b.remove(); } }); }, 300);
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('button, a, [role="tab"]'); if (!btn) return;
    const t = (btn.innerText || '').trim();
    if (t !== 'Items' && t !== 'Categories' && t !== 'Variants' && t !== 'Addons') return;
    const catP = document.getElementById('menuCategoriesPanel'), varP = document.getElementById('menuVariationsPanel'), fC = document.getElementById('addMenuForm')?.closest('.panel, section, div'), iL = document.getElementById('manageMenuList')?.closest('.panel, section');
    if (!catP && !varP) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.rpRefreshAllTabs();
    if (t === 'Items') { if(fC) fC.style.display=''; if(iL) iL.style.display=''; if(catP) catP.style.display='none'; if(varP) varP.style.display='none'; }
    else if (t === 'Categories') { if(fC) fC.style.display='none'; if(iL) iL.style.display='none'; if(catP) { catP.style.display='block'; catP.classList.remove('hidden'); } if(varP) varP.style.display='none'; }
    else { if(fC) fC.style.display='none'; if(iL) iL.style.display='none'; if(catP) catP.style.display='none'; if(varP) { varP.style.display='block'; varP.classList.remove('hidden'); } }
  }, true);
})();
