
(function(){
  const OUTLETS = ['Main Outlet','RestaurantPro - Andhra Pradesh','RestaurantPro - Arunachal Pradesh','RestaurantPro - Assam','RestaurantPro - Bihar','RestaurantPro - Chhattisgarh','RestaurantPro - Goa','RestaurantPro - Gujarat','RestaurantPro - Haryana','RestaurantPro - Himachal Pradesh','RestaurantPro - Jharkhand','RestaurantPro - Karnataka','RestaurantPro - Kerala','RestaurantPro - Madhya Pradesh','RestaurantPro - Maharashtra','RestaurantPro - Manipur','RestaurantPro - Meghalaya','RestaurantPro - Mizoram','RestaurantPro - Nagaland','RestaurantPro - Noida','RestaurantPro - Odisha','RestaurantPro - Punjab','RestaurantPro - Rajasthan','RestaurantPro - Sikkim','RestaurantPro - Tamil Nadu','RestaurantPro - Telangana','RestaurantPro - Tripura','RestaurantPro - Uttar Pradesh','RestaurantPro - Uttarakhand','RestaurantPro - West Bengal','RestaurantPro - Delhi'];
  const curOut = () => localStorage.getItem('rpSelectedOutlet') || 'Main Outlet';
  const isHO = () => curOut() === 'Head Office';

  window.rpMenuStore = {
    getCats1: () => JSON.parse(localStorage.getItem('rpMenuCat1') || '["Continental","South Indian","North Indian","Chinese","Sweets","Retail & Chocolates"]'),
    getMenu: () => {
      let m = JSON.parse(localStorage.getItem('rpEntMenuItems') || '[]');
      if (!m.length) {
        m = [{ id:'m1', name:'5 Star Chocolate', shortCode:'234', barcode:'8905STAR234', price:40, cat1:'Retail & Chocolates', cat2:'Retail', cat3:'Self Creatable', vendor:'Arun Traders Vendor', selfCreate:true, selfUnit:'1 Pc', outlets:OUTLETS }];
        localStorage.setItem('rpEntMenuItems', JSON.stringify(m));
      }
      return m;
    },
    getReqs: () => JSON.parse(localStorage.getItem('rpEntMenuReqs') || '[]'),
    getVars: () => JSON.parse(localStorage.getItem('rpEntVars') || '[{"name":"100gm","dept":"Quantity"},{"name":"250gm","dept":"Quantity"},{"name":"500gm","dept":"Quantity"},{"name":"1 Kg","dept":"Quantity"},{"name":"6 Pcs","dept":"Quantity"}]'),
    getAddons: () => JSON.parse(localStorage.getItem('rpEntAddons') || '[{"name":"Extra Chutney","dept":"Condiments","price":15},{"name":"Extra Cheese","dept":"Pizza Addon","price":40},{"name":"Choice of Breads","dept":"Main Course","price":30}]')
  };

  function mountEnterpriseMenu(host) {
    if (document.getElementById('rpEntMenuRoot')) return;
    const root = document.createElement('div');
    root.id = 'rpEntMenuRoot';
    root.style.cssText = 'background:#f8fafc;border:1px solid #cbd5e1;border-radius:14px;padding:16px;margin-top:12px;font-family:Cambria,Georgia,serif';
    root.innerHTML = `
      <div style="display:flex;gap:8px;border-bottom:2px solid #e2e8f0;padding-bottom:10px;margin-bottom:14px;flex-wrap:wrap">
        <button type="button" class="rp-mtab" data-t="items" style="background:#0f766e;color:#fff;border:0;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Items (4-Cat + Barcode + Approval)</button>
        <button type="button" class="rp-mtab" data-t="cats" style="background:#fff;color:#0f766e;border:1px solid #cbd5e1;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Categories (1, 2, 3, 4)</button>
        <button type="button" class="rp-mtab" data-t="vars" style="background:#fff;color:#0f766e;border:1px solid #cbd5e1;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Variations</button>
        <button type="button" class="rp-mtab" data-t="addons" style="background:#fff;color:#0f766e;border:1px solid #cbd5e1;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Addons</button>
        <span style="margin-left:auto;font-size:12px;font-weight:700;color:#0f766e;align-self:center" id="rpEntOutTag"></span>
      </div>
      <div id="rpEntBody"></div>
    `;
    host.innerHTML = '';
    host.appendChild(root);
    document.getElementById('rpEntOutTag').textContent = isHO() ? 'Head Office Master (Can Approve & Assign 31 Outlets)' : 'Outlet: ' + curOut() + ' (All Changes Require HO Approval)';
    root.querySelectorAll('.rp-mtab').forEach(b => b.onclick = () => {
      root.querySelectorAll('.rp-mtab').forEach(x => { x.style.background='#fff'; x.style.color='#0f766e'; });
      b.style.background='#0f766e'; b.style.color='#fff';
      renderEntTab(b.dataset.t);
    });
    renderEntTab('items');
  }

  window.renderEntTab = function(tab) {
    const box = document.getElementById('rpEntBody');
    if (!box) return;
    if (tab === 'cats') {
      const c1 = rpMenuStore.getCats1();
      box.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">' +
        '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><b>1. Category One (Cuisine)</b><div style="display:flex;gap:6px;margin:8px 0"><input id="newC1Inp" placeholder="Continental, South Indian" style="flex:1;padding:6px"><button type="button" onclick="const v=newC1Inp.value.trim();if(v){const l=rpMenuStore.getCats1();l.push(v);localStorage.setItem(\'rpMenuCat1\',JSON.stringify(l));renderEntTab(\'cats\');}" style="background:#0f766e;color:#fff;border:0;padding:6px 10px;border-radius:6px">+ Add</button></div>' + c1.map(x=>'<div style="padding:4px;border-bottom:1px solid #f1f5f9">'+x+'</div>').join('') + '</div>' +
        '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><b>2. Category Two</b><p style="font-size:13px">Restaurant, Retail, Sweet, Bakery, Namkeen</p></div>' +
        '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><b>3. Category Three</b><p style="font-size:13px">Self Creatable, Manual Creatable</p></div>' +
        '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><b>4. Vendor Category</b><p style="font-size:13px">Arun Traders Vendor, Brij Mohan Dairy, Tamanna Traders, Ajay Kumar Dryfruits, Metro Packaging</p></div></div>';
      return;
    }
    if (tab === 'vars') {
      const vs = rpMenuStore.getVars();
      box.innerHTML = '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><div style="display:flex;gap:8px;margin-bottom:8px"><input id="vName" placeholder="e.g. 250gm, 1 Kg"><button type="button" onclick="if(vName.value){const l=rpMenuStore.getVars();l.push({name:vName.value,dept:\'Quantity\'});localStorage.setItem(\'rpEntVars\',JSON.stringify(l));renderEntTab(\'vars\');}" style="background:#0f766e;color:#fff;border:0;padding:7px 12px;border-radius:6px">+ Add Variation</button></div>' + vs.map(v=>'<div style="padding:5px;border-bottom:1px solid #eee"><b>'+v.name+'</b> ('+v.dept+')</div>').join('') + '</div>';
      return;
    }
    if (tab === 'addons') {
      const ads = rpMenuStore.getAddons();
      box.innerHTML = '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1"><div style="display:flex;gap:8px;margin-bottom:8px"><input id="aName" placeholder="Addon Name"><input id="aPrice" type="number" placeholder="Price"><button type="button" onclick="if(aName.value){const l=rpMenuStore.getAddons();l.push({name:aName.value,dept:\'Addon\',price:Number(aPrice.value||0)});localStorage.setItem(\'rpEntAddons\',JSON.stringify(l));renderEntTab(\'addons\');}" style="background:#0f766e;color:#fff;border:0;padding:7px 12px;border-radius:6px">+ Add Addon</button></div>' + ads.map(a=>'<div style="padding:5px;border-bottom:1px solid #eee"><b>'+a.name+'</b> - Rs.'+a.price+'</div>').join('') + '</div>';
      return;
    }

    const c1Opts = rpMenuStore.getCats1().map(c=>'<option>'+c+'</option>').join('');
    const reqs = rpMenuStore.getReqs();
    const items = rpMenuStore.getMenu().filter(it => isHO() || (it.outlets||[]).includes(curOut()));
    box.innerHTML = '<div style="background:#fff;padding:12px;border-radius:10px;border:1px solid #cbd5e1;margin-bottom:12px"><strong style="color:#0f766e">+ Add Menu Item (Sends to Head Office Approval)</strong>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px;margin-top:8px">' +
      '<div><label style="font-size:11px;font-weight:700">Item Name *</label><input id="emName" placeholder="5 Star Chocolate" oninput="emAutoBar()" style="width:100%;padding:6px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Short Code *</label><input id="emCode" placeholder="234" oninput="emAutoBar()" style="width:100%;padding:6px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Barcode (Auto) *</label><input id="emBar" placeholder="Auto-filled" style="width:100%;padding:6px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Price (Rs.) *</label><input id="emPrice" type="number" placeholder="40" style="width:100%;padding:6px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">1. Category One *</label><select id="emCat1" style="width:100%;padding:6px">' + c1Opts + '</select></div>' +
      '<div><label style="font-size:11px;font-weight:700">2. Category Two *</label><select id="emCat2" style="width:100%;padding:6px"><option>Restaurant</option><option selected>Retail</option><option>Sweet</option><option>Bakery</option><option>Namkeen</option></select></div>' +
      '<div><label style="font-size:11px;font-weight:700">3. Category Three *</label><select id="emCat3" onchange="emCat3Toggle()" style="width:100%;padding:6px"><option value="Self Creatable">Self Creatable</option><option value="Manual Creatable">Manual Creatable</option></select></div>' +
      '<div><label style="font-size:11px;font-weight:700">4. Vendor Category *</label><select id="emVendor" style="width:100%;padding:6px"><option>Arun Traders Vendor</option><option>Brij Mohan Dairy</option><option>Tamanna Traders</option><option>Ajay Kumar Dryfruits</option><option>Metro Packaging</option></select></div></div>' +
      '<div style="background:#f0fdf4;padding:8px;border-radius:8px;margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
      '<label style="font-size:12.5px;font-weight:700;color:#0f766e"><input type="checkbox" id="emSelfChk" checked onchange="emCat3Toggle()"> Create Self Item Recipe (Auto Raw Material + Barcode + Recipe)</label>' +
      '<div id="emUnitBox"><select id="emUnit" style="padding:5px"><option>1 Pc</option><option>1 Kg</option><option>1 Pkt</option></select></div>' +
      '<div id="emManBox" style="display:none"><input id="emManIng" placeholder="Manual Raw Materials (e.g. Maida 0.2kg)" style="width:260px;padding:5px"></div>' +
      '<button type="button" onclick="submitMenuReq(\'ADD\')" style="margin-left:auto;background:#0f766e;color:#fff;border:0;padding:7px 14px;border-radius:7px;font-weight:700">Submit for HO Approval &rarr;</button></div></div>' +
      '<div style="background:#fffbeb;padding:10px;border-radius:10px;border:1px solid #fde68a;margin-bottom:12px;overflow-x:auto"><strong style="color:#b45309">Head Office Approval Queue (' + reqs.length + ')</strong>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px"><tr><th style="border:1px solid #cbd5e1;padding:5px">Action</th><th style="border:1px solid #cbd5e1;padding:5px">Item</th><th style="border:1px solid #cbd5e1;padding:5px">4 Categories</th><th style="border:1px solid #cbd5e1;padding:5px">Barcode</th><th style="border:1px solid #cbd5e1;padding:5px">From</th><th style="border:1px solid #cbd5e1;padding:5px">HO Action</th></tr>' +
      (reqs.map(r=>'<tr><td style="border:1px solid #cbd5e1;padding:5px"><b>'+r.action+'</b></td><td style="border:1px solid #cbd5e1;padding:5px"><b>'+r.item.name+'</b> (Rs.'+r.item.price+')</td><td style="border:1px solid #cbd5e1;padding:5px">'+r.item.cat1+' / '+r.item.cat2+' / '+r.item.cat3+' / '+r.item.vendor+'</td><td style="border:1px solid #cbd5e1;padding:5px">'+r.item.barcode+'</td><td style="border:1px solid #cbd5e1;padding:5px">'+r.reqBy+'</td><td style="border:1px solid #cbd5e1;padding:5px">'+(isHO()?'<button type="button" onclick="openHoOutPicker(\''+r.reqId+'\')" style="background:#0f766e;color:#fff;border:0;padding:4px 8px;border-radius:5px">Select Outlets &amp; Approve</button>':'Pending HO')+'</td></tr>').join('') || '<tr><td colspan="6" style="padding:6px">No pending requests.</td></tr>') + '</table></div>' +
      '<div style="background:#fff;padding:10px;border-radius:10px;border:1px solid #cbd5e1;overflow-x:auto"><strong style="color:#115e59">Approved Menu Items (' + items.length + ')</strong>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px"><tr><th style="border:1px solid #cbd5e1;padding:5px">Name</th><th style="border:1px solid #cbd5e1;padding:5px">Cat 1</th><th style="border:1px solid #cbd5e1;padding:5px">Cat 2</th><th style="border:1px solid #cbd5e1;padding:5px">Cat 3</th><th style="border:1px solid #cbd5e1;padding:5px">Vendor</th><th style="border:1px solid #cbd5e1;padding:5px">Code</th><th style="border:1px solid #cbd5e1;padding:5px">Barcode</th><th style="border:1px solid #cbd5e1;padding:5px">Price</th><th style="border:1px solid #cbd5e1;padding:5px">Actions</th></tr>' +
      items.map(it=>'<tr><td style="border:1px solid #cbd5e1;padding:5px"><b>'+it.name+'</b></td><td style="border:1px solid #cbd5e1;padding:5px">'+it.cat1+'</td><td style="border:1px solid #cbd5e1;padding:5px">'+it.cat2+'</td><td style="border:1px solid #cbd5e1;padding:5px">'+it.cat3+'</td><td style="border:1px solid #cbd5e1;padding:5px"><b>'+it.vendor+'</b></td><td style="border:1px solid #cbd5e1;padding:5px">'+it.shortCode+'</td><td style="border:1px solid #cbd5e1;padding:5px"><b>'+it.barcode+'</b></td><td style="border:1px solid #cbd5e1;padding:5px">Rs.'+it.price+'</td><td style="border:1px solid #cbd5e1;padding:5px"><button type="button" onclick="alert(\'Barcode: '+it.barcode+' | Outlets: '+(it.outlets||[]).length+'\')">View</button> <button type="button" onclick="reqEditDel(\''+it.id+'\',\'EDIT\')">Edit</button> <button type="button" onclick="reqEditDel(\''+it.id+'\',\'DELETE\')" style="color:#dc2626">Del</button></td></tr>').join('') + '</table></div><div id="hoPickerModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center"></div>';
  };

  window.emAutoBar = function() {
    if (document.getElementById('emSelfChk')?.checked) {
      const n = (document.getElementById('emName').value||'ITEM').replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6);
      const c = (document.getElementById('emCode').value||'101').replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
      document.getElementById('emBar').value = '890' + n + c;
    }
  };
  window.emCat3Toggle = function() {
    const isSelf = document.getElementById('emCat3').value === 'Self Creatable';
    document.getElementById('emSelfChk').checked = isSelf;
    document.getElementById('emUnitBox').style.display = isSelf ? 'block' : 'none';
    document.getElementById('emManBox').style.display = isSelf ? 'none' : 'block';
    if (isSelf) emAutoBar();
  };
  window.submitMenuReq = function(act, existing) {
    const item = existing || { id:'m-'+Date.now(), name:emName.value.trim(), shortCode:emCode.value.trim(), barcode:emBar.value.trim(), price:Number(emPrice.value||0), cat1:emCat1.value, cat2:emCat2.value, cat3:emCat3.value, vendor:emVendor.value, selfCreate:emSelfChk.checked, selfUnit:emUnit.value, manIng:emManIng.value, outlets:[curOut()] };
    if (!item.name) return alert('Enter Item Name');
    const q = rpMenuStore.getReqs(); q.unshift({ reqId:'REQ-'+Date.now(), action:act, item, reqBy:curOut() });
    localStorage.setItem('rpEntMenuReqs', JSON.stringify(q)); renderEntTab('items'); alert('Sent to Head Office Approval!');
  };
  window.reqEditDel = function(id, act) {
    const it = rpMenuStore.getMenu().find(x=>x.id===id); if (!it) return;
    if (act === 'EDIT') { const np = prompt('New Price for ' + it.name + ' (HO Approval):', it.price); if (!np) return; it.price = Number(np); }
    submitMenuReq(act, it);
  };
  window.openHoOutPicker = function(reqId) {
    const req = rpMenuStore.getReqs().find(x=>x.reqId===reqId); if (!req) return;
    const m = document.getElementById('hoPickerModal'); m.style.display = 'flex';
    m.innerHTML = '<div style="background:#fff;padding:18px;border-radius:12px;max-width:580px;width:92%"><h3>Grant Access to Outlets: '+req.item.name+'</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-height:220px;overflow:auto;margin:10px 0">'+OUTLETS.map(o=>'<label style="font-size:12px"><input type="checkbox" class="ho-chk" value="'+o+'" checked> '+o+'</label>').join('')+'</div><button type="button" onclick="confirmHoApprove(\''+reqId+'\')" style="background:#0f766e;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700">Approve &amp; Sync</button> <button type="button" onclick="hoPickerModal.style.display=\'none\'" style="padding:8px 12px">Cancel</button></div>';
  };
  window.confirmHoApprove = function(reqId) {
    const q = rpMenuStore.getReqs(), idx = q.findIndex(x=>x.reqId===reqId), req = q[idx];
    const sel = Array.from(document.querySelectorAll('.ho-chk:checked')).map(c=>c.value);
    let menu = rpMenuStore.getMenu();
    if (req.action === 'DELETE') menu = menu.filter(x=>x.id !== req.item.id);
    else {
      req.item.outlets = sel; const mi = menu.findIndex(x=>x.id === req.item.id);
      if (mi >= 0) menu[mi] = req.item; else menu.unshift(req.item);
      if (req.item.selfCreate) sel.forEach(o => { const k='rpInventoryStock::'+o, st=JSON.parse(localStorage.getItem(k)||'{}'); if(st[req.item.name]===undefined) st[req.item.name]=50; localStorage.setItem(k,JSON.stringify(st)); });
      const bars = JSON.parse(localStorage.getItem('rpGeneratedBarcodes')||'[]'); bars.unshift({ name: req.item.name, code: req.item.shortCode, barcode: req.item.barcode, price: req.item.price }); localStorage.setItem('rpGeneratedBarcodes', JSON.stringify(bars));
    }
    localStorage.setItem('rpEntMenuItems', JSON.stringify(menu)); q.splice(idx, 1); localStorage.setItem('rpEntMenuReqs', JSON.stringify(q));
    document.getElementById('hoPickerModal').style.display = 'none'; renderEntTab('items');
  };
  setInterval(() => {
    const marker = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.innerText||'').trim() === 'Menu Management - Add Item');
    if (marker) { const box = marker.closest('.main') || marker.parentElement.parentElement; const cards = box ? box.querySelectorAll('.card, form') : []; if (cards.length && !document.getElementById('rpEntMenuRoot')) mountEnterpriseMenu(cards.parentElement); }
  }, 400);
})();
