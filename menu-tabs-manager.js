(function(){
  const OUTS = ['Main Outlet','RestaurantPro - Andhra Pradesh','RestaurantPro - Arunachal Pradesh','RestaurantPro - Assam','RestaurantPro - Bihar','RestaurantPro - Chhattisgarh','RestaurantPro - Goa','RestaurantPro - Gujarat','RestaurantPro - Haryana','RestaurantPro - Himachal Pradesh','RestaurantPro - Jharkhand','RestaurantPro - Karnataka','RestaurantPro - Kerala','RestaurantPro - Madhya Pradesh','RestaurantPro - Maharashtra','RestaurantPro - Manipur','RestaurantPro - Meghalaya','RestaurantPro - Mizoram','RestaurantPro - Nagaland','RestaurantPro - Noida','RestaurantPro - Odisha','RestaurantPro - Punjab','RestaurantPro - Rajasthan','RestaurantPro - Sikkim','RestaurantPro - Tamil Nadu','RestaurantPro - Telangana','RestaurantPro - Tripura','RestaurantPro - Uttar Pradesh','RestaurantPro - Uttarakhand','RestaurantPro - West Bengal','RestaurantPro - Delhi'];
  const getOut = () => localStorage.getItem('rpSelectedOutlet') || 'Main Outlet';
  const isHO = () => getOut() === 'Head Office';

  const getCats = () => JSON.parse(localStorage.getItem('rpTabCats') || '[{"id":"c1","level":"1. Category One","name":"Continental","rank":1,"status":"Active","outlets":[]},{"id":"c2","level":"1. Category One","name":"South Indian","rank":2,"status":"Active","outlets":[]},{"id":"c3","level":"2. Category Two","name":"Restaurant","rank":1,"status":"Active","outlets":[]},{"id":"c4","level":"2. Category Two","name":"Retail","rank":2,"status":"Active","outlets":[]},{"id":"c5","level":"3. Category Three","name":"Self Creatable","rank":1,"status":"Active","outlets":[]},{"id":"c6","level":"3. Category Three","name":"Manual Creatable","rank":2,"status":"Active","outlets":[]},{"id":"c7","level":"4. Vendor Category","name":"Arun Traders Vendor","rank":1,"status":"Active","outlets":[]}]');
  const getVars = () => JSON.parse(localStorage.getItem('rpTabVars') || '[{"id":"v1","name":"100gm","dept":"Quantity","rank":1,"status":"Active","outlets":[]},{"id":"v2","name":"250gm","dept":"Quantity","rank":2,"status":"Active","outlets":[]},{"id":"v3","name":"500gm","dept":"Quantity","rank":3,"status":"Active","outlets":[]},{"id":"v4","name":"1 Kg","dept":"Quantity","rank":4,"status":"Active","outlets":[]}]');
  const getAddons = () => JSON.parse(localStorage.getItem('rpTabAddons') || '[{"id":"a1","dept":"Choice Of Breads","display":"Choice Of Breads","price":30,"rank":1,"status":"Active","outlets":[]},{"id":"a2","dept":"Extra Chutney","display":"Extra Chutney","price":15,"rank":2,"status":"Active","outlets":[]},{"id":"a3","dept":"Extra Cheese","display":"Extra Cheese","price":40,"rank":3,"status":"Active","outlets":[]}]');
  const getReqs = () => JSON.parse(localStorage.getItem('rpCvaApprovalQueue') || '[]');

  window.rpSendCvaReq = (type, action, item) => {
    const q = getReqs();
    q.unshift({ reqId: 'CVA-' + Date.now(), type, action, item, reqBy: getOut() });
    localStorage.setItem('rpCvaApprovalQueue', JSON.stringify(q));
    alert(action + ' request for "' + (item.name || item.dept) + '" sent to Head Office Approval!');
    window.rpRefreshAllTabs();
  };

  window.rpOpenCvaHo = (reqId) => {
    const req = getReqs().find(x => x.reqId === reqId); if (!req) return;
    let m = document.getElementById('rpCvaHoModal');
    if (!m) { m = document.createElement('div'); m.id = 'rpCvaHoModal'; m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center'; document.body.appendChild(m); }
    m.style.display = 'flex';
    m.innerHTML = '<div style="background:#fff;padding:18px;border-radius:12px;max-width:560px;width:92%"><h3>HO Approval (' + req.type + ' - ' + req.action + '): ' + (req.item.name || req.item.dept) + '</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-height:220px;overflow:auto;margin:10px 0">' + OUTS.map(o => '<label style="font-size:12px"><input type="checkbox" class="cva-ochk" value="' + o + '" checked> ' + o + '</label>').join('') + '</div><button type="button" data-r="' + reqId + '" onclick="rpExecCvaHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700">Approve &amp; Push to Outlets</button> <button type="button" onclick="rpCvaHoModal.style.display='none'" style="padding:8px 12px">Cancel</button></div>';
  };

  window.rpExecCvaHo = (reqId) => {
    const q = getReqs(), idx = q.findIndex(x => x.reqId === reqId), req = q[idx];
    const sel = Array.from(document.querySelectorAll('.cva-ochk:checked')).map(c => c.value);
    const key = req.type === 'CATEGORY' ? 'rpTabCats' : (req.type === 'VARIANT' ? 'rpTabVars' : 'rpTabAddons');
    let list = req.type === 'CATEGORY' ? getCats() : (req.type === 'VARIANT' ? getVars() : getAddons());
    if (req.action === 'DELETE') list = list.filter(x => x.id !== req.item.id);
    else { req.item.outlets = sel; const i = list.findIndex(x => x.id === req.item.id); if (i >= 0) list[i] = req.item; else list.push(req.item); }
    localStorage.setItem(key, JSON.stringify(list));
    q.splice(idx, 1); localStorage.setItem('rpCvaApprovalQueue', JSON.stringify(q));
    document.getElementById('rpCvaHoModal').style.display = 'none';
    window.rpRefreshAllTabs();
  };

  window.rpExportCvaExcel = (type) => {
    const rows = type === 'CATEGORY' ? [['Level','Name','Status'], ...getCats().map(c=>[c.level,c.name,c.status])] :
                 type === 'VARIANT' ? [['Variant','Department','Status'], ...getVars().map(v=>[v.name,v.dept,v.status])] :
                 [['Department','Display Name','Price','Status'], ...getAddons().map(a=>[a.dept,a.display,a.price,a.status])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'})); a.download = type + '_List.csv'; a.click();
  };

  const renderApBanner = () => {
    const q = getReqs();
    return '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;margin-bottom:12px"><strong style="color:#b45309;font-size:12.5px">Head Office Approval Requests: ' + q.length + '</strong>' +
      (q.length ? '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px"><tr style="background:#fef3c7"><th style="padding:5px;border:1px solid #cbd5e1">Tab</th><th style="padding:5px;border:1px solid #cbd5e1">Action</th><th style="padding:5px;border:1px solid #cbd5e1">Name</th><th style="padding:5px;border:1px solid #cbd5e1">By</th><th style="padding:5px;border:1px solid #cbd5e1">HO Action</th></tr>' +
      q.map(r=>'<tr><td style="padding:5px;border:1px solid #cbd5e1"><b>'+r.type+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+r.action+'</td><td style="padding:5px;border:1px solid #cbd5e1"><b>'+(r.item.name||r.item.dept)+'</b></td><td style="padding:5px;border:1px solid #cbd5e1">'+r.reqBy+'</td><td style="padding:5px;border:1px solid #cbd5e1">'+(isHO()?'<button type="button" data-r="'+r.reqId+'" onclick="rpOpenCvaHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:4px 8px;border-radius:5px">Approve</button>':'Pending HO')+'</td></tr>').join('') + '</table>' : '') + '</div>';
  };

  window.rpRefreshAllTabs = () => {
    const catP = document.getElementById('menuCategoriesPanel');
    const varP = document.getElementById('menuVariationsPanel');
    const filt = l => l.filter(x => isHO() || !x.outlets || !x.outlets.length || x.outlets.includes(getOut()));

    if (catP) {
      const cs = filt(getCats());
      catP.innerHTML = renderApBanner() + '<div class="panel-head"><h2>Categories (Create New -> HO Approval)</h2><button type="button" onclick="rpExportCvaExcel(\'CATEGORY\')" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff">Excel</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><select id="nCatL" style="padding:7px"><option>1. Category One</option><option>2. Category Two</option><option>3. Category Three</option><option>4. Vendor Category</option></select><input id="nCatN" placeholder="New Category Name" style="padding:7px"><button type="button" onclick="if(nCatN.value.trim())rpSendCvaReq(\'CATEGORY\',\'CREATE\',{id:\'c-\'+Date.now(),level:nCatL.value,name:nCatN.value.trim(),rank:1,status:\'Active\'})" style="background:#0f766e;color:#fff;border:0;padding:7px 14px;border-radius:7px;font-weight:700">+ Create New Category (HO)</button></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="background:#eef6f4"><th style="padding:7px;border:1px solid #cbd5e1">Level</th><th style="padding:7px;border:1px solid #cbd5e1">Name</th><th style="padding:7px;border:1px solid #cbd5e1">Status</th><th style="padding:7px;border:1px solid #cbd5e1">Actions</th></tr></thead><tbody>' +
        cs.map(c=>'<tr><td style="padding:7px;border:1px solid #cbd5e1"><b>'+c.level+'</b></td><td style="padding:7px;border:1px solid #cbd5e1">'+c.name+'</td><td style="padding:7px;border:1px solid #cbd5e1">'+c.status+'</td><td style="padding:7px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+c.name+'\')">View</button> <button type="button" onclick="const nn=prompt(\'Edit Name:\',\''+c.name+'\');if(nn)rpSendCvaReq(\'CATEGORY\',\'EDIT\',{id:\''+c.id+'\',level:\''+c.level+'\',name:nn,rank:1,status:\'Active\'})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'CATEGORY\',\'DELETE\',{id:\''+c.id+'\',name:\''+c.name+'\'})">Delete</button></td></tr>').join('') + '</tbody></table>';
    }

    if (varP) {
      const vs = filt(getVars()), ads = filt(getAddons());
      varP.innerHTML = renderApBanner() +
        '<div class="panel-head"><h2>Variants (Create New -> HO Approval)</h2><button type="button" onclick="rpExportCvaExcel(\'VARIANT\')" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff">Excel</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="nVarN" placeholder="Variant Name (e.g. 250gm)" style="padding:7px"><input id="nVarD" value="Quantity" style="padding:7px"><button type="button" onclick="if(nVarN.value.trim())rpSendCvaReq(\'VARIANT\',\'CREATE\',{id:\'v-\'+Date.now(),name:nVarN.value.trim(),dept:nVarD.value,rank:1,status:\'Active\'})" style="background:#0f766e;color:#fff;border:0;padding:7px 14px;border-radius:7px;font-weight:700">+ Create New Variant (HO)</button></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:16px"><thead><tr style="background:#eef6f4"><th style="padding:7px;border:1px solid #cbd5e1">Variant</th><th style="padding:7px;border:1px solid #cbd5e1">Department</th><th style="padding:7px;border:1px solid #cbd5e1">Status</th><th style="padding:7px;border:1px solid #cbd5e1">Actions</th></tr></thead><tbody>' +
        vs.map(v=>'<tr><td style="padding:7px;border:1px solid #cbd5e1"><b>'+v.name+'</b></td><td style="padding:7px;border:1px solid #cbd5e1">'+v.dept+'</td><td style="padding:7px;border:1px solid #cbd5e1">'+v.status+'</td><td style="padding:7px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+v.name+'\')">View</button> <button type="button" onclick="const nn=prompt(\'Edit Variant:\',\''+v.name+'\');if(nn)rpSendCvaReq(\'VARIANT\',\'EDIT\',{id:\''+v.id+'\',name:nn,dept:\''+v.dept+'\',rank:1,status:\'Active\'})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'VARIANT\',\'DELETE\',{id:\''+v.id+'\',name:\''+v.name+'\'})">Delete</button></td></tr>').join('') + '</tbody></table>' +

        '<div class="panel-head" style="border-top:2px solid #e2e8f0;padding-top:12px"><h2>Addons (Create New -> HO Approval)</h2><button type="button" onclick="rpExportCvaExcel(\'ADDON\')" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff">Excel</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="nAdD" placeholder="Department Name" style="padding:7px"><input id="nAdS" placeholder="Display Name" style="padding:7px"><input id="nAdP" type="number" placeholder="Price" style="width:95px;padding:7px"><button type="button" onclick="if(nAdD.value.trim())rpSendCvaReq(\'ADDON\',\'CREATE\',{id:\'a-\'+Date.now(),dept:nAdD.value.trim(),display:nAdS.value.trim()||nAdD.value.trim(),price:Number(nAdP.value||0),rank:1,status:\'Active\'})" style="background:#0f766e;color:#fff;border:0;padding:7px 14px;border-radius:7px;font-weight:700">+ Create New Addon (HO)</button></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="background:#eef6f4"><th style="padding:7px;border:1px solid #cbd5e1">Department</th><th style="padding:7px;border:1px solid #cbd5e1">Display Name</th><th style="padding:7px;border:1px solid #cbd5e1">Price</th><th style="padding:7px;border:1px solid #cbd5e1">Actions</th></tr></thead><tbody>' +
        ads.map(a=>'<tr><td style="padding:7px;border:1px solid #cbd5e1"><b>'+a.dept+'</b></td><td style="padding:7px;border:1px solid #cbd5e1">'+a.display+'</td><td style="padding:7px;border:1px solid #cbd5e1">Rs.'+a.price+'</td><td style="padding:7px;border:1px solid #cbd5e1"><button type="button" onclick="alert(\''+a.dept+' - Rs.'+a.price+'\')">View</button> <button type="button" onclick="const np=prompt(\'Edit Price:\',\''+a.price+'\');if(np)rpSendCvaReq(\'ADDON\',\'EDIT\',{id:\''+a.id+'\',dept:\''+a.dept+'\',display:\''+a.display+'\',price:Number(np),rank:1,status:\'Active\'})">Edit</button> <button type="button" style="color:#dc2626" onclick="rpSendCvaReq(\'ADDON\',\'DELETE\',{id:\''+a.id+'\',dept:\''+a.dept+'\'})">Delete</button></td></tr>').join('') + '</tbody></table>';
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rpRefreshAllTabs);
  else rpRefreshAllTabs();
})();