(function(){
  const host = document.getElementById('rpProMenuSection');
  if (!host) return;
  const OUTS = ['Main Outlet','RestaurantPro - Andhra Pradesh','RestaurantPro - Arunachal Pradesh','RestaurantPro - Assam','RestaurantPro - Bihar','RestaurantPro - Chhattisgarh','RestaurantPro - Goa','RestaurantPro - Gujarat','RestaurantPro - Haryana','RestaurantPro - Himachal Pradesh','RestaurantPro - Jharkhand','RestaurantPro - Karnataka','RestaurantPro - Kerala','RestaurantPro - Madhya Pradesh','RestaurantPro - Maharashtra','RestaurantPro - Manipur','RestaurantPro - Meghalaya','RestaurantPro - Mizoram','RestaurantPro - Nagaland','RestaurantPro - Noida','RestaurantPro - Odisha','RestaurantPro - Punjab','RestaurantPro - Rajasthan','RestaurantPro - Sikkim','RestaurantPro - Tamil Nadu','RestaurantPro - Telangana','RestaurantPro - Tripura','RestaurantPro - Uttar Pradesh','RestaurantPro - Uttarakhand','RestaurantPro - West Bengal','RestaurantPro - Delhi'];
  const getOut = () => localStorage.getItem('rpSelectedOutlet') || 'Main Outlet';
  const isHO = () => getOut() === 'Head Office';
  const getItems = () => {
    let l = JSON.parse(localStorage.getItem('rpMasterMenuItems') || '[]');
    if (!l.length) {
      l = [{ id:'m1', name:'5 Star Chocolate', shortCode:'234', barcode:'8905STAR234', price:40, cat1:'Retail & Chocolates', cat2:'Retail', cat3:'Self Creatable', vendor:'Arun Traders Vendor', selfCreate:true, selfUnit:'1 Pc', manRec:'', outlets:OUTS }];
      localStorage.setItem('rpMasterMenuItems', JSON.stringify(l));
    }
    return l;
  };
  const getReqs = () => JSON.parse(localStorage.getItem('rpMenuApprovalQueue') || '[]');

  host.innerHTML = '<section class="panel menu-list-panel" style="border-top:4px solid #0f766e;margin-top:14px">' +
    '<div class="panel-head"><h2>Enterprise 4-Category Menu, Auto-Barcode, Self-Recipe &amp; HO Approval</h2><span id="pmOutTag" style="font-size:12px;color:#0f766e;font-weight:700"></span></div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:12px">' +
      '<div><label style="font-size:11px;font-weight:700">Item Name *</label><input id="pmName" placeholder="5 Star Chocolate" style="width:100%;padding:7px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Short Code *</label><input id="pmCode" placeholder="234" style="width:100%;padding:7px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Barcode (Auto-Filled) *</label><input id="pmBar" placeholder="Auto-generated" style="width:100%;padding:7px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">Price (Rs.) *</label><input id="pmPrice" type="number" placeholder="40" style="width:100%;padding:7px"></div>' +
      '<div><label style="font-size:11px;font-weight:700">1. Category One *</label><select id="pmC1" style="width:100%;padding:7px"><option>Continental</option><option>South Indian</option><option>North Indian</option><option>Chinese</option><option>Sweets</option><option selected>Retail &amp; Chocolates</option></select></div>' +
      '<div><label style="font-size:11px;font-weight:700">2. Category Two *</label><select id="pmC2" style="width:100%;padding:7px"><option>Restaurant</option><option selected>Retail</option><option>Sweet</option><option>Bakery</option><option>Namkeen</option></select></div>' +
      '<div><label style="font-size:11px;font-weight:700">3. Category Three *</label><select id="pmC3" style="width:100%;padding:7px"><option value="Self Creatable">Self Creatable</option><option value="Manual Creatable">Manual Creatable</option></select></div>' +
      '<div><label style="font-size:11px;font-weight:700">4. Vendor Category *</label><select id="pmVen" style="width:100%;padding:7px"><option>Arun Traders Vendor</option><option>Brij Mohan Dairy</option><option>Tamanna Traders</option><option>Ajay Kumar Dryfruits</option><option>Metro Packaging</option></select></div>' +
      '<div style="grid-column:1/-1;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
        '<label style="font-size:12.5px;font-weight:700;color:#0f766e"><input type="checkbox" id="pmSelfChk" checked> Self-Create Recipe (Same Raw Material + Auto Barcode + Recipe)</label>' +
        '<select id="pmUnit" style="padding:6px"><option>1 Pc</option><option>1 Kg</option><option>1 Pkt</option></select>' +
        '<input id="pmMan" placeholder="Manual Recipe (e.g. Maida 0.2kg, Cheese 0.1kg)" style="display:none;width:260px;padding:6px">' +
        '<button type="button" id="pmSubBtn" style="margin-left:auto;background:#0f766e;color:#fff;border:0;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Submit to Head Office Approval &rarr;</button>' +
      '</div></div>';

  host.firstElementChild.insertAdjacentHTML('beforeend',
    '<div style="overflow-x:auto;margin-bottom:12px"><strong style="color:#b45309;font-size:13px">Head Office Approval Queue:</strong><table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px"><thead><tr style="background:#fef3c7"><th style="padding:6px;border:1px solid #cbd5e1">Action</th><th style="padding:6px;border:1px solid #cbd5e1">Item</th><th style="padding:6px;border:1px solid #cbd5e1">4 Categories</th><th style="padding:6px;border:1px solid #cbd5e1">Barcode</th><th style="padding:6px;border:1px solid #cbd5e1">From</th><th style="padding:6px;border:1px solid #cbd5e1">HO Approval</th></tr></thead><tbody id="pmApBody"></tbody></table></div>' +
    '<div style="overflow-x:auto"><strong style="color:#115e59;font-size:13px">Approved Outlet Menu Items:</strong><table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px"><thead><tr style="background:#eef6f4"><th style="padding:6px;border:1px solid #cbd5e1">Name</th><th style="padding:6px;border:1px solid #cbd5e1">Cat 1</th><th style="padding:6px;border:1px solid #cbd5e1">Cat 2</th><th style="padding:6px;border:1px solid #cbd5e1">Cat 3</th><th style="padding:6px;border:1px solid #cbd5e1">Vendor</th><th style="padding:6px;border:1px solid #cbd5e1">Code</th><th style="padding:6px;border:1px solid #cbd5e1">Barcode</th><th style="padding:6px;border:1px solid #cbd5e1">Price</th><th style="padding:6px;border:1px solid #cbd5e1">Actions</th></tr></thead><tbody id="pmMenuBody"></tbody></table></div>' +
    '<div id="pmHoModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center"></div>'
  );

  const autoBar = () => { if (pmSelfChk.checked) pmBar.value = '890' + (pmName.value||'ITEM').replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6) + (pmCode.value||'101'); };
  pmName.oninput = autoBar; pmCode.oninput = autoBar;
  pmC3.onchange = () => { const s = pmC3.value === 'Self Creatable'; pmSelfChk.checked = s; pmUnit.style.display = s ? 'inline-block' : 'none'; pmMan.style.display = s ? 'none' : 'inline-block'; if (s) autoBar(); };
  pmSelfChk.onchange = () => { pmC3.value = pmSelfChk.checked ? 'Self Creatable' : 'Manual Creatable'; pmC3.onchange(); };

  pmSubBtn.onclick = () => {
    if (!pmName.value.trim()) return alert('Enter Item Name');
    if (pmSelfChk.checked && !pmBar.value) autoBar();
    const item = { id:'m-'+Date.now(), name:pmName.value.trim(), shortCode:pmCode.value.trim(), barcode:pmBar.value.trim(), price:Number(pmPrice.value||0), cat1:pmC1.value, cat2:pmC2.value, cat3:pmC3.value, vendor:pmVen.value, selfCreate:pmSelfChk.checked, selfUnit:pmUnit.value, manRec:pmMan.value, outlets:[getOut()] };
    const q = getReqs(); q.unshift({ reqId:'REQ-'+Date.now(), action:'ADD', item, reqBy:getOut() });
    localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q)); pmName.value=''; pmBar.value=''; draw(); alert('Sent to Head Office Approval!');
  };

  window.pmReqAct = (id, act) => {
    const it = getItems().find(x=>x.id===id); if (!it) return;
    const cp = Object.assign({}, it);
    if (act === 'EDIT') { const np = prompt('New Price (Goes to HO Approval):', it.price); if (!np) return; cp.price = Number(np); }
    const q = getReqs(); q.unshift({ reqId:'REQ-'+Date.now(), action:act, item:cp, reqBy:getOut() });
    localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q)); draw(); alert('Request sent to HO Approval!');
  };

  window.pmOpenHo = (reqId) => {
    const req = getReqs().find(x=>x.reqId===reqId); if (!req) return;
    pmHoModal.style.display = 'flex';
    pmHoModal.innerHTML = '<div style="background:#fff;padding:18px;border-radius:12px;max-width:560px;width:92%"><h3>Grant Outlet Access: '+req.item.name+'</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-height:210px;overflow:auto;margin:10px 0">'+OUTS.map(o=>'<label style="font-size:12px"><input type="checkbox" class="pm-chk" value="'+o+'" checked> '+o+'</label>').join('')+'</div><button type="button" data-r="'+reqId+'" onclick="pmDoHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700">Approve &amp; Sync</button> <button type="button" onclick="pmHoModal.style.display=\'none\'" style="padding:8px 12px">Cancel</button></div>';
  };

  window.pmDoHo = (reqId) => {
    const q = getReqs(), i = q.findIndex(x=>x.reqId===reqId), req = q[i];
    const sel = Array.from(document.querySelectorAll('.pm-chk:checked')).map(c=>c.value);
    let m = getItems();
    if (req.action === 'DELETE') m = m.filter(x=>x.id !== req.item.id);
    else {
      req.item.outlets = sel; const mi = m.findIndex(x=>x.id === req.item.id);
      if (mi >= 0) m[mi] = req.item; else m.unshift(req.item);
      if (req.item.selfCreate) sel.forEach(o => { const k='rpInventoryStock::'+o, st=JSON.parse(localStorage.getItem(k)||'{}'); if(st[req.item.name]===undefined) st[req.item.name]=50; localStorage.setItem(k,JSON.stringify(st)); });
      const bars = JSON.parse(localStorage.getItem('rpGeneratedBarcodes')||'[]'); bars.unshift({ name:req.item.name, code:req.item.shortCode, barcode:req.item.barcode, price:req.item.price }); localStorage.setItem('rpGeneratedBarcodes', JSON.stringify(bars));
    }
    localStorage.setItem('rpMasterMenuItems', JSON.stringify(m)); q.splice(i,1); localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q));
    pmHoModal.style.display = 'none'; draw();
  };

  function draw() {
    pmOutTag.textContent = isHO() ? 'Head Office Master' : 'Outlet: ' + getOut();
    const q = getReqs();
    pmApBody.innerHTML = q.map(r=>'<tr><td style="padding:5px;border:1px solid #cbd5e1"><b>'+r.action+'</b></td><td style="padding:5px;border:1px solid #cbd5e1"><b>'+r.item.name+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+r.item.cat1+'/'+r.item.cat2+'/'+r.item.cat3+'/'+r.item.vendor+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+r.item.barcode+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+r.reqBy+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+(isHO()?'<button type="button" data-r="'+r.reqId+'" onclick="pmOpenHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:4px 8px;border-radius:5px">Approve</button>':'Pending HO')+'</td></tr>').join('') || '<tr><td colspan="6" style="padding:6px">No pending HO requests.</td></tr>';
    const list = getItems().filter(it=>isHO()||(it.outlets||[]).includes(getOut()));
    pmMenuBody.innerHTML = list.map(it=>'<tr><td style="padding:5px;border:1px solid #cbd5e1"><b>'+it.name+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+it.cat1+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+it.cat2+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+it.cat3+'</td><td style="padding:5px;border:1px solid #cbd5e1"><b>'+it.vendor+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+it.shortCode+'</td><td style="padding:5px;border:1px solid #cbd5e1"><b>'+it.barcode+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">Rs.'+it.price+'</td><td style="padding:5px;border:1px solid #cbd5e1"><button type="button" data-b="'+it.barcode+'" onclick="alert(this.dataset.b)">View</button> <button type="button" data-id="'+it.id+'" onclick="pmReqAct(this.dataset.id,this.innerText)">Edit</button> <button type="button" data-id="'+it.id+'" onclick="pmReqAct(this.dataset.id,this.innerText)" style="color:#dc2626">DELETE</button></td></tr>').join('');
  }
  draw();
})();
