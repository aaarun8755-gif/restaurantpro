
(function(){
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

  window.rpSyncSelfMode = function() {
    const c3 = document.getElementById('rpMenuCat3');
    const chk = document.getElementById('newItemRecipe');
    const isSelf = c3 ? c3.value === 'Self Creatable' : (chk ? chk.checked : true);
    if (chk) chk.checked = isSelf;
    if (document.getElementById('rpSelfUnitCol')) document.getElementById('rpSelfUnitCol').style.display = isSelf ? 'block' : 'none';
    if (document.getElementById('rpManRecCol')) document.getElementById('rpManRecCol').style.display = isSelf ? 'none' : 'block';
    if (isSelf) window.rpAutoFillMenuBarcode();
  };

  window.rpAutoFillMenuBarcode = function() {
    const form = document.getElementById('newItemRecipe')?.closest('form');
    if (!form) return;
    const textInputs = form.querySelectorAll('input[type="text"], input:not([type])');
    const nm = (textInputs[0]?.value || 'ITEM').replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6);
    const sc = (textInputs[1]?.value || '101').replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
    const barInp = document.getElementById('rpMenuBarcode');
    if (barInp) barInp.value = '890' + nm + sc;
  };

  window.rpRender4CatTables = function() {
    const apB = document.getElementById('rpHoApBody');
    const okB = document.getElementById('rpApproved4CatBody');
    if (!apB || !okB) return;
    const reqs = getReqs();
    apB.innerHTML = reqs.map(r => '<tr><td style="padding:6px;border:1px solid #cbd5e1"><b>'+r.action+'</b></td><td style="padding:6px;border:1px solid #cbd5e1"><b>'+r.item.name+'</b> (Rs.'+r.item.price+')</td><td style="padding:6px;border:1px solid #cbd5e1">'+r.item.cat1+' / '+r.item.cat2+' / '+r.item.cat3+' / '+r.item.vendor+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+r.item.barcode+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+(r.item.selfCreate?'Self ('+r.item.selfUnit+')':r.item.manRec)+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+r.reqBy+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+(isHO()?'<button type="button" data-r="'+r.reqId+'" onclick="rpOpenHoModal(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:5px 10px;border-radius:6px;cursor:pointer">Select Outlets &amp; Approve</button>':'Pending HO')+'</td></tr>').join('') || '<tr><td colspan="7" style="padding:7px">No pending HO requests.</td></tr>';

    const list = getItems().filter(it => isHO() || (it.outlets || []).includes(getOut()));
    okB.innerHTML = list.map(it => '<tr><td style="padding:6px;border:1px solid #cbd5e1"><b>'+it.name+'</b></td><td style="padding:6px;border:1px solid #cbd5e1">'+it.cat1+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+it.cat2+'</td><td style="padding:6px;border:1px solid #cbd5e1">'+it.cat3+'</td><td style="padding:6px;border:1px solid #cbd5e1"><b>'+it.vendor+'</b></td><td style="padding:6px;border:1px solid #cbd5e1"><b>'+it.barcode+'</b></td><td style="padding:6px;border:1px solid #cbd5e1">Rs.'+it.price+'</td><td style="padding:6px;border:1px solid #cbd5e1"><button type="button" data-b="'+it.barcode+'" onclick="alert('Barcode: '+this.dataset.b)">View</button> <button type="button" data-id="'+it.id+'" onclick="rpReqEditDel(this.dataset.id,'EDIT')">Edit</button> <button type="button" data-id="'+it.id+'" onclick="rpReqEditDel(this.dataset.id,'DELETE')" style="color:#dc2626">Del</button></td></tr>').join('');

    const vp = document.getElementById('menuVariationsPanel');
    if (vp && !vp.dataset.rpReady) {
      vp.dataset.rpReady = '1';
      vp.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><strong>Variations (Quantity / Size)</strong><p style="font-size:12.5px">100gm, 250gm, 500gm, 1 Kg, 6 Pcs, Regular, Medium, Large</p></div><div><strong>Addons (Extras)</strong><p style="font-size:12.5px">Extra Chutney (+Rs.15), Extra Cheese (+Rs.40), Choice of Breads (+Rs.30)</p></div></div>';
    }
  };

  window.rpReqEditDel = function(id, act) {
    const it = getItems().find(x => x.id === id); if (!it) return;
    const copy = Object.assign({}, it);
    if (act === 'EDIT') { const np = prompt('New Price for ' + it.name + ' (Sends to HO Approval):', it.price); if (!np) return; copy.price = Number(np); }
    const q = getReqs(); q.unshift({ reqId:'REQ-'+Date.now(), action:act, item:copy, reqBy:getOut() });
    localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q)); rpRender4CatTables(); alert('Request sent to Head Office Approval!');
  };

  window.rpOpenHoModal = function(reqId) {
    const req = getReqs().find(x => x.reqId === reqId); if (!req) return;
    const m = document.getElementById('rpHoOutModal'); m.style.display = 'flex';
    m.innerHTML = '<div style="background:#fff;padding:18px;border-radius:12px;max-width:580px;width:92%"><h3>Grant Outlet Access: '+req.item.name+'</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-height:220px;overflow:auto;margin:10px 0">'+OUTS.map(o=>'<label style="font-size:12px"><input type="checkbox" class="rp-ho-o" value="'+o+'" checked> '+o+'</label>').join('')+'</div><button type="button" data-r="'+reqId+'" onclick="rpExecHo(this.dataset.r)" style="background:#0f766e;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700">Approve &amp; Sync Raw Material + Barcode</button> <button type="button" onclick="rpHoOutModal.style.display='none'" style="padding:8px 12px">Cancel</button></div>';
  };

  window.rpExecHo = function(reqId) {
    const q = getReqs(), i = q.findIndex(x => x.reqId === reqId), req = q[i];
    const sel = Array.from(document.querySelectorAll('.rp-ho-o:checked')).map(c => c.value);
    let m = getItems();
    if (req.action === 'DELETE') m = m.filter(x => x.id !== req.item.id);
    else {
      req.item.outlets = sel; const mi = m.findIndex(x => x.id === req.item.id);
      if (mi >= 0) m[mi] = req.item; else m.unshift(req.item);
      if (req.item.selfCreate) sel.forEach(o => { const k='rpInventoryStock::'+o, st=JSON.parse(localStorage.getItem(k)||'{}'); if(st[req.item.name]===undefined) st[req.item.name]=50; localStorage.setItem(k,JSON.stringify(st)); });
      const bars = JSON.parse(localStorage.getItem('rpGeneratedBarcodes')||'[]'); bars.unshift({ name:req.item.name, code:req.item.shortCode, barcode:req.item.barcode, price:req.item.price }); localStorage.setItem('rpGeneratedBarcodes', JSON.stringify(bars));
    }
    localStorage.setItem('rpMasterMenuItems', JSON.stringify(m)); q.splice(i,1); localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q));
    document.getElementById('rpHoOutModal').style.display = 'none'; rpRender4CatTables();
  };

  document.addEventListener('DOMContentLoaded', function() {
    const chk = document.getElementById('newItemRecipe');
    const form = chk ? chk.closest('form') : null;
    if (chk) chk.addEventListener('change', function() { document.getElementById('rpMenuCat3').value = chk.checked ? 'Self Creatable' : 'Manual Creatable'; rpSyncSelfMode(); });
    if (form) {
      const inps = form.querySelectorAll('input[type="text"], input:not([type])');
      if (inps[0]) inps[0].addEventListener('input', rpAutoFillMenuBarcode);
      if (inps[1]) inps[1].addEventListener('input', rpAutoFillMenuBarcode);
      form.addEventListener('submit', function() {
        const name = (inps[0]?.value || '').trim(); if (!name) return;
        const shortCode = (inps[1]?.value || '101').trim();
        const price = Number(form.querySelector('input[type="number"]')?.value || 0);
        const selfCreate = !!document.getElementById('newItemRecipe')?.checked;
        if (selfCreate && !document.getElementById('rpMenuBarcode').value) rpAutoFillMenuBarcode();
        const item = { id:'m-'+Date.now(), name, shortCode, barcode:document.getElementById('rpMenuBarcode').value, price, cat1:document.getElementById('rpMenuCat1').value, cat2:document.getElementById('rpMenuCat2').value, cat3:document.getElementById('rpMenuCat3').value, vendor:document.getElementById('rpMenuVendor').value, selfCreate, selfUnit:document.getElementById('rpMenuSelfUnit').value, manRec:document.getElementById('rpMenuManRec').value, outlets:[getOut()] };
        const q = getReqs(); q.unshift({ reqId:'REQ-'+Date.now(), action:'ADD', item, reqBy:getOut() });
        localStorage.setItem('rpMenuApprovalQueue', JSON.stringify(q));
        setTimeout(rpRender4CatTables, 200);
      });
    }
    rpRender4CatTables();
  });
})();
