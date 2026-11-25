const $=s=>document.querySelector(s),app=$('#app');const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const me=()=>JSON.parse(localStorage.getItem('msa_user')||'null');const fmt=n=>Number(n||0).toLocaleString('id-ID');
const LEAVE_META={
  ANNUAL:{label:'Cuti Tahunan',unit:'hari kerja',hint:'Dihitung berdasarkan hari kerja (tidak termasuk Minggu & hari libur non-potong cuti).'},
  LONG:{label:'Istirahat Panjang',unit:'hari kalender',hint:'Istirahat panjang (30 hari per kelipatan 5 tahun masa kerja); dihitung berdasarkan hari kalender.'},
  MATERNITY:{label:'Cuti Melahirkan (Pasal 121)',unit:'hari kalender',hint:'UU No. 27 Tahun 2026 Pasal 121 (maksimal 90 hari kalender; tidak memotong cuti tahunan).'},
  PATERNITY:{label:'Cuti Pendampingan Melahirkan (Pasal 124)',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 Pasal 124 (maksimal 2 hari; tidak memotong cuti tahunan).'},
  MENSTRUAL:{label:'Cuti Haid (Pasal 120)',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 Pasal 120 (maksimal 2 hari per bulan; tidak memotong cuti tahunan).'},
  MARRIAGE:{label:'Cuti Menikah',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Cuti menikah selama 3 hari (tidak memotong cuti tahunan).'},
  CHILD_MARRIAGE:{label:'Cuti Menikahkan Anak',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Cuti menikahkan anak selama 2 hari (tidak memotong cuti tahunan).'},
  CHILD_CIRCUMCISION:{label:'Cuti Menghitankan Anak',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Cuti menghitankan anak selama 2 hari (tidak memotong cuti tahunan).'},
  CHILD_BAPTISM:{label:'Cuti Membaptiskan Anak',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Cuti membaptiskan anak selama 2 hari (tidak memotong cuti tahunan).'},
  BEREAVEMENT_FAMILY:{label:'Cuti Keluarga Meninggal Dunia',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Suami/istri, orang tua/mertua, atau anak/menantu meninggal dunia selama 2 hari.'},
  BEREAVEMENT_HOUSEHOLD:{label:'Cuti Anggota Keluarga Serumah Meninggal',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Anggota keluarga serumah meninggal dunia selama 1 hari.'},
  STATE_DUTY:{label:'Cuti Kewajiban Terhadap Negara',unit:'hari kerja',hint:'UU No. 27 Tahun 2026 — Menjalankan kewajiban terhadap negara (durasi sesuai kebijakan perusahaan).'},
  RELIGIOUS_PILGRIMAGE:{label:'Cuti Ibadah (Umroh/Haji/Ziarah Tanah Suci)',unit:'hari kalender',hint:'UU No. 27 Tahun 2026 — Cuti ibadah Umroh/Haji/Ziarah Tanah Suci (durasi sesuai kebijakan perusahaan).'}
};
const leaveMeta=t=>LEAVE_META[String(t||'ANNUAL').toUpperCase()]||LEAVE_META.ANNUAL;

function login(){app.innerHTML=`<main class="login"><form class="loginbox" id="loginForm"><div class="brand">FORM <span>PENGAJUAN CUTI</span></div><p>PT MULTISARANA AVINDO</p><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Masuk</button><div id="msg" class="msg"></div><small>Created by UQ</small></form></main>`;$('#loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const d=await API.call('login',{username:f.get('username'),password:f.get('password')});localStorage.setItem('msa_token',d.token);localStorage.setItem('msa_user',JSON.stringify(d.user));render();}catch(x){$('#msg').textContent=x.message;}};}
function render(){if(!me())return login();const u=me(),nav=[['Dashboard','dashboard'],['Pengajuan Cuti','leave'],['Riwayat Cuti','history'],['Surat Cuti','docs'],['Kalender Libur','holidays'],['Ganti Password','password']];if(['ADMIN','HRD','KABAG'].includes(u.role))nav.splice(1,0,['Approval','approval']);if(['ADMIN','HRD'].includes(u.role))nav.push(['Data Karyawan','employees'],['Pengaturan Hari Libur','holiday-admin'],['Laporan','reports']);if(u.role==='ADMIN')nav.push(['Manajemen User','users'],['Audit Log','audit'],['Backup','backup']);app.innerHTML=`<div class="layout"><aside><div class="brand">MSA <span>HRIS</span></div><div class="profile"><b>${esc(u.full_name)}</b><small>${esc(u.role)}</small></div><nav>${nav.map(([n,k])=>`<button data-page="${k}">${n}</button>`).join('')}</nav><button id="logout" class="logout">Keluar</button><footer>Created by UQ</footer></aside><main class="main"><header><div><h1 id="pageTitle">Dashboard</h1><small>PT Multisarana Avindo</small></div><div class="status" id="status"></div></header><section id="content"></section></main></div>`;document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));$('#logout').onclick=async()=>{try{await API.call('logout')}catch{}localStorage.removeItem('msa_token');localStorage.removeItem('msa_user');login();};updateStatus();page('dashboard');}
function updateStatus(){const s=$('#status');if(s)s.textContent=navigator.onLine?'● Online':'● Offline · data tersimpan lokal';}window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
async function call(action,p={}){return API.call(action,p)}function loading(){ $('#content').innerHTML='<div class="panel">Memuat data…</div>'; }function fail(e){$('#content').innerHTML=`<div class="panel error">${esc(e.message)}</div>`;}
async function page(key){const names={dashboard:'Dashboard',leave:'Pengajuan Cuti',history:'Riwayat Cuti',approval:'Approval Cuti',docs:'Arsip Surat Cuti',holidays:'Kalender Hari Libur',employees:'Database Karyawan','holiday-admin':'Pengaturan Hari Libur',reports:'Laporan Cuti',users:'Manajemen User',audit:'Audit Log',backup:'Backup Database',password:'Ganti Password'};$('#pageTitle').textContent=names[key]||key;loading();try{if(key==='dashboard')return dashboard();if(key==='leave')return leaveForm();if(key==='history'||key==='approval')return leaveList(key);if(key==='docs')return docs();if(key==='holidays'||key==='holiday-admin')return holidayPage(key);if(key==='employees')return employees();if(key==='reports')return reports();if(key==='users')return users();if(key==='audit')return audit();if(key==='backup')return backup();if(key==='password')return passwordPage();}catch(e){fail(e);}}
async function dashboard(){const d=await call('dashboard');$('#content').innerHTML=`<div class="stats"><div class="stat"><small>Menunggu Kabag</small><b>${d.pendingKabag}</b></div><div class="stat"><small>Menunggu HRD</small><b>${d.pendingHrd}</b></div><div class="stat"><small>Surat Terbit</small><b>${d.approved}</b></div><div class="stat"><small>Total Hari Cuti</small><b>${fmt(d.totalDays)}</b></div>${d.balance?`<div class="stat"><small>Sisa Saldo</small><b>${fmt(d.balance.total_available)}</b></div>`:''}</div><div class="panel"><h3>Rekap cuti bulanan ${d.year}</h3><div class="bars">${d.monthly.map(x=>`<div><span>${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][x.month-1]}</span><b style="width:${Math.min(100,x.days*5)}%"></b><em>${x.days}</em></div>`).join('')}</div></div>`;}

async function leaveForm(){
  let bal=null;
  if(me().role==='KARYAWAN'&&navigator.onLine)bal=await call('employeeBalance').catch(()=>null);
  const ll=bal?.long_leave||null;
  const sl=bal?.special_leaves||null;
  const longSummary=ll
    ?(ll.eligible
      ?`Istirahat Panjang: siap dipakai ${ll.remaining} hari (masa kerja ${ll.tenure_years} thn)`
      :`Istirahat Panjang: belum eligible (masa kerja ${ll.tenure_years||0} thn${ll.next_eligible_date?`, aktif ${ll.next_eligible_date}`:''})`)
    :'';
  const mensSummary=sl?`Sisa Cuti Haid bulan ini: ${sl.menstrual_remaining} hari`:'';
  const typeOptions=Object.keys(LEAVE_META).map(k=>`<option value="${k}">${esc(LEAVE_META[k].label)}</option>`).join('');

  $('#content').innerHTML=`<div class="panel"><h3>Form Pengajuan Cuti</h3>${bal?`<div class="balance">Saldo tahunan ${bal.annual_remaining} hari · Carry forward ${bal.carry_remaining} hari · Total ${bal.total_available} hari${longSummary?` · ${esc(longSummary)}`:''}${mensSummary?` · ${esc(mensSummary)}`:''}</div>`:''}<form id="leaveForm"><div class="formgrid"><label>Jenis pengajuan<select name="leave_type" id="leaveTypeSelect">${typeOptions}</select></label><div id="leaveTypeHint" class="type-hint">${esc(LEAVE_META.ANNUAL.hint)}</div><label>Tanggal mulai<input name="start_date" type="date" required></label><label>Tanggal selesai<input name="end_date" type="date" required></label></div><label>Alasan pengajuan<textarea name="reason" maxlength="500" required></textarea></label><button class="primary">Kirim Pengajuan</button><div class="msg" id="msg"></div><small>Jika offline, pengajuan disimpan sebagai draft lokal dan dikirim otomatis saat koneksi kembali. Approval tetap harus dilakukan online.</small></form></div>`;

  const typeSel=$('#leaveTypeSelect'),hintEl=$('#leaveTypeHint');
  const syncHint=()=>{
    if(!hintEl)return;
    hintEl.textContent=leaveMeta(typeSel?.value).hint;
  };
  if(typeSel){typeSel.onchange=syncHint;syncHint();}

  $('#leaveForm').onsubmit=async e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const f=Object.fromEntries(new FormData(form));
    f.client_request_id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random();
    if(!navigator.onLine){
      const q=JSON.parse(localStorage.getItem('msa_leave_queue')||'[]');
      q.push({...f,queued_at:new Date().toISOString()});
      localStorage.setItem('msa_leave_queue',JSON.stringify(q));
      if($('#msg'))$('#msg').textContent='Draft tersimpan di perangkat. Akan dikirim saat online.';
      form?.reset();
      syncHint();
      return;
    }
    try{
      const d=await call('createLeave',f);
      const label=leaveMeta(d.leave_type).label;
      if($('#msg'))$('#msg').textContent=`Pengajuan ${label} terkirim (${d.total_days} hari), status ${d.status}.`;
      form?.reset();
      syncHint();
    }catch(x){
      if($('#msg'))$('#msg').textContent=x.message;
    }
  };
}

async function leaveList(kind){
  const u=me(),status=kind==='approval'?(u.role==='HRD'?'WAITING_HRD':'WAITING_KABAG'):'';
  const [a,emps]=await Promise.all([call('listLeaves',{status}),call('listEmployees').catch(()=>[])]);
  const empMap=Object.fromEntries((emps||[]).map(e=>[e.employee_id,e]));
  window.__leavesCache=a;
  window.__empMapCache=empMap;
  $('#content').innerHTML=`<div class="panel"><div class="tablewrap"><table><thead><tr><th>ID</th><th>Karyawan</th><th>Jenis</th><th>Periode</th><th>Hari</th><th>Status</th>${kind==='approval'?'<th>Aksi</th>':''}</tr></thead><tbody>${a.map(x=>{
    const emp=empMap[x.employee_id]||{};
    const nama=x.employee_name||x.name||emp.name||x.employee_id;
    const jenisLabel=leaveMeta(x.leave_type).label;
    return `<tr><td>${esc(x.leave_id.slice(0,8))}</td><td>${esc(nama)}</td><td><span class="pill">${esc(jenisLabel)}</span></td><td>${esc(x.start_date)} – ${esc(x.end_date)}</td><td>${x.total_days}</td><td><span class="pill">${esc(x.status)}</span></td>${kind==='approval'?`<td><button type="button" class="btn-secondary" onclick="openLeaveModal('${x.leave_id}')">Detail</button> <button type="button" onclick="decide('${x.leave_id}',true)">Approve</button> <button type="button" class="danger" onclick="decide('${x.leave_id}',false)">Tolak</button></td>`:''}</tr>`;
  }).join('')||'<tr><td colspan="7">Tidak ada data.</td></tr>'}</tbody></table></div></div><div id="leaveModalSlot"></div>`;
}

window.closeLeaveModal=()=>{const slot=$('#leaveModalSlot');if(slot)slot.innerHTML='';};
window.openLeaveModal=async id=>{
  const x=(window.__leavesCache||[]).find(z=>z.leave_id===id);
  if(!x)return;
  const emp=(window.__empMapCache||{})[x.employee_id]||{};
  const nama=x.employee_name||x.name||emp.name||x.employee_id;
  const dept=x.department_name||'-';
  const meta=leaveMeta(x.leave_type);
  const slot=$('#leaveModalSlot');
  slot.innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeLeaveModal()"><div class="modal-box"><div class="modal-head"><h3>Detail Pengajuan Cuti</h3><button type="button" class="modal-close" onclick="closeLeaveModal()">✕</button></div><div class="detail-grid"><div class="detail-item"><small>Nama Karyawan</small><b>${esc(nama)}</b></div><div class="detail-item"><small>Departemen</small><b>${esc(dept)}</b></div><div class="detail-item"><small>Jenis Pengajuan</small><b>${esc(meta.label)}</b></div><div class="detail-item"><small>Status</small><b>${esc(x.status)}</b></div><div class="detail-item"><small>Tanggal Mulai</small><b>${esc(x.start_date)}</b></div><div class="detail-item"><small>Tanggal Selesai</small><b>${esc(x.end_date)}</b></div><div class="detail-item"><small>Jumlah Hari</small><b>${esc(x.total_days)} ${esc(meta.unit)}</b></div></div><div id="modalBalance" class="detail-bal">Memuat saldo cuti…</div><div class="detail-reason"><small>Alasan Cuti</small><p>${esc(x.reason||'-')}</p></div>${x.kabag_note?`<div class="detail-reason"><small>Catatan Kabag</small><p>${esc(x.kabag_note)}</p></div>`:''}<label class="modal-note-label">Alasan / Catatan Approve atau Tolak<textarea id="modalDecisionNote" maxlength="500" placeholder="Opsional untuk Approve, wajib diisi jika Tolak"></textarea></label><div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeLeaveModal()">Tutup</button><button type="button" onclick="submitModalDecision('${x.leave_id}',true)">Approve</button><button type="button" class="danger" onclick="submitModalDecision('${x.leave_id}',false)">Tolak</button></div></div></div>`;
  try{
    const bal=await call('employeeBalance',{employee_id:x.employee_id,date:x.start_date});
    const el=$('#modalBalance');
    const longTxt=bal.long_leave?` · Istirahat panjang sisa ${bal.long_leave.remaining} hari (masa kerja ${bal.long_leave.tenure_years} thn)`:'';
    const mensTxt=bal.special_leaves?` · Sisa cuti haid bulan ${bal.special_leaves.menstrual_month}: ${bal.special_leaves.menstrual_remaining} hari`:'';
    if(el)el.textContent=`Saldo tahunan sisa ${bal.annual_remaining} hari · Carry forward ${bal.carry_remaining} hari · Total tersedia ${bal.total_available} hari${longTxt}${mensTxt}`;
  }catch{
    const el=$('#modalBalance');
    if(el)el.style.display='none';
  }
};

window.submitModalDecision=async(id,yes)=>{
  const note=($('#modalDecisionNote')?.value||'').trim();
  if(!yes&&!note){alert('Alasan penolakan wajib diisi.');$('#modalDecisionNote')?.focus();return;}
  closeLeaveModal();
  await decide(id,yes,note);
};
window.decide=async(id,yes,presetNote='')=>{
  const note=yes?presetNote:(presetNote||prompt('Alasan penolakan (wajib)'));
  if(!yes&&!note)return;
  try{
    const d=await call(yes?'approveLeave':'rejectLeave',{leave_id:id,note});
    alert(yes?(d.document?'Surat terbit: '+d.document.document_number:'Approval berhasil'):'Pengajuan ditolak');
    page('approval');
  }catch(e){alert(e.message);}
};
async function docs(){const [a,emps]=await Promise.all([call('listDocuments',{year:new Date().getFullYear()}),call('listEmployees').catch(()=>[])]);const empMap=Object.fromEntries((emps||[]).map(e=>[e.employee_id,e.name]));$('#content').innerHTML=`<div class="panel"><h3>Arsip Surat Penetapan Cuti</h3><div class="tablewrap"><table><tr><th>Nomor Surat</th><th>Karyawan</th><th>Tanggal Terbit</th><th>PDF</th></tr>${a.map(x=>`<tr><td>${esc(x.document_number)}</td><td>${esc(x.employee_name||x.name||empMap[x.employee_id]||x.employee_id)}</td><td>${esc(x.issued_at)}</td><td><a target="_blank" rel="noopener" href="https://drive.google.com/uc?id=${encodeURIComponent(x.drive_file_id)}&export=download">Unduh PDF</a></td></tr>`).join('')||'<tr><td colspan="4">Belum ada surat.</td></tr>'}</table></div></div>`}

async function holidayPage(admin, selectedYear=null){
  const curYear=new Date().getFullYear();
  const years=[curYear-1, curYear, curYear+1, curYear+2];
  const y=Number(selectedYear)||curYear;
  const a=await call('listHolidays',{year:y});
  const defaultDate=`${y}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;

  $('#content').innerHTML=`
    <div class="panel">
      <div class="formgrid">
        <label>Pilih Tahun Kalender
          <select id="holidayYearSelect">
            ${years.map(yr=>`<option value="${yr}"${yr===y?' selected':''}>Tahun ${yr}${yr===curYear?' (Tahun Berjalan)':yr===curYear+1?' (Tahun Depan)':''}</option>`).join('')}
          </select>
        </label>
        <div class="type-hint">Gunakan pemilih tahun untuk melihat daftar hari libur atau menginput jadwal tahun depan.</div>
      </div>
    </div>
    ${admin==='holiday-admin'?`<div class="panel"><h3>Tambah Hari Libur (${y})</h3><form id="hf" class="formgrid"><label>Tanggal<input name="date" type="date" value="${defaultDate}" required></label><label>Nama<input name="name" required></label><label>Jenis<select name="holiday_type" id="holidayType"><option value="NATIONAL">Libur Nasional</option><option value="COLLECTIVE">Cuti Bersama</option><option value="COMPANY">Libur Perusahaan</option></select></label><label>Catatan<input name="notes"></label><label id="deductWrap" style="display:none;grid-column:1/-1"><input type="checkbox" name="deduct_annual_leave" value="true" style="display:inline-block;width:auto;margin-right:8px">Potong saldo cuti tahunan jika diambil cuti bersama (centang jika memotong cuti; kosongkan jika libur)</label><button class="primary">Simpan</button></form></div>`:''}
    <div class="panel"><h3>Hari Libur ${y}</h3>${a.map(x=>{const isCol=String(x.holiday_type)==='COLLECTIVE';const potong=x.deduct_annual_leave===true||String(x.deduct_annual_leave).toLowerCase()==='true';return `<div class="listrow"><b>${esc(x.date)}</b> ${esc(x.name)} <span class="pill">${esc(x.holiday_type)}</span>${isCol?` <span class="pill">${potong?'Potong Cuti Tahunan':'Libur (Tanpa Potong Cuti)'}</span>`:''}</div>`;}).join('')||'Belum ada data.'}</div>
  `;

  const yearSel=$('#holidayYearSelect');
  if(yearSel){
    yearSel.onchange=()=>holidayPage(admin, Number(yearSel.value));
  }

  const typeSel=$('#holidayType'),deductWrap=$('#deductWrap');
  const toggleDeduct=()=>{if(deductWrap)deductWrap.style.display=typeSel?.value==='COLLECTIVE'?'block':'none';};
  if(typeSel){typeSel.onchange=toggleDeduct;toggleDeduct();}

  if($('#hf'))$('#hf').onsubmit=async e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const raw=Object.fromEntries(new FormData(form));
    raw.deduct_annual_leave=Boolean(form.elements.deduct_annual_leave?.checked);
    const inputYear=raw.date&&/^\d{4}-\d{2}-\d{2}$/.test(raw.date)?Number(raw.date.slice(0,4)):y;
    try{
      await call('saveHoliday',raw);
      await holidayPage(admin, inputYear);
    }catch(x){
      alert(x.message);
    }
  };
}

async function employees(){const a=await call('listEmployees'),deps=await call('listDepartments');$('#content').innerHTML=`<div class="panel"><h3>Tambah / Edit Karyawan</h3><form id="ef" class="formgrid"><input type="hidden" name="employee_id"><label>NIK<input name="nik" placeholder="NIK" required></label><label>Nama lengkap<input name="name" placeholder="Nama lengkap" required></label><label>Jabatan<input name="position" placeholder="Jabatan"></label><label>Departemen<select name="department_id"><option value="">Pilih departemen</option>${deps.map(d=>`<option value="${d.department_id}">${esc(d.name)}</option>`).join('')}</select></label><label>Jenis karyawan<select name="employment_type"><option value="STAFF">Staff</option><option value="NON_STAFF">Non Staff</option></select></label><label>Lokasi kerja<input name="work_location" placeholder="Lokasi kerja"></label><label>Tanggal masuk<input name="join_date" type="date"></label><label>Hak cuti tahunan<input name="annual_entitlement" type="number" value="12" min="0"></label><label>Carry forward<input name="carry_forward" type="number" value="0" min="0"></label><label>Batas carry forward<input name="carry_expiry" type="date"></label><label>Potongan izin<input name="permission_deduction" type="number" value="0" min="0" placeholder="Potongan izin"></label><label>Tambahan overtime<input name="overtime_credit" type="number" value="0" min="0" placeholder="Tambahan overtime"></label><button class="primary">Simpan Karyawan</button></form></div><div class="panel"><div class="tablewrap"><table><tr><th>Employee ID</th><th>NIK</th><th>Nama</th><th>Jabatan</th><th>Departemen ID</th><th>Jenis</th><th>Aksi</th></tr>${a.map(x=>`<tr><td>${esc(x.employee_id)}</td><td>${esc(x.nik)}</td><td>${esc(x.name)}</td><td>${esc(x.position)}</td><td>${esc(x.department_id)}</td><td>${esc(x.employment_type)}</td><td><button type="button" onclick="editEmployee('${x.employee_id}')">Edit</button> <button type="button" class="danger" onclick="deactivateEmployee('${x.employee_id}')">Nonaktifkan</button></td></tr>`).join('')}</table></div></div>`;$('#ef').onsubmit=async e=>{e.preventDefault();try{await call('saveEmployee',Object.fromEntries(new FormData(e.currentTarget)));page('employees');}catch(x){alert(x.message);}};window.editEmployee=id=>{const x=a.find(z=>z.employee_id===id);if(!x)return;const f=$('#ef');Object.entries(x).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});f.scrollIntoView({behavior:'smooth'});};window.deactivateEmployee=async id=>{if(!confirm('Nonaktifkan karyawan ini?'))return;try{await call('deactivateEmployee',{employee_id:id});page('employees');}catch(x){alert(x.message);}};}
async function reports(){const d=await call('dashboardReport',{year:new Date().getFullYear()});$('#content').innerHTML=`<div class="panel"><h3>Laporan Cuti ${d.year}</h3><p>${d.records} pengajuan · ${d.total_days} hari cuti</p><div class="tablewrap"><table><tr><th>Nama</th><th>Departemen</th><th>Periode</th><th>Hari</th><th>No. Surat</th></tr>${d.data.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.department)}</td><td>${x.start_date} – ${x.end_date}</td><td>${x.total_days}</td><td>${esc(x.document_number)}</td></tr>`).join('')}</table></div></div>`;}
async function users(){const a=await call('listUsers'),deps=await call('listDepartments'),kabags=a.filter(x=>x.role==='KABAG');$('#content').innerHTML=`<div class="panel"><h3>Tambah User</h3><p>Untuk akun karyawan, isi Employee ID dari tabel Database Karyawan.</p><form id="uf" class="formgrid"><input name="username" placeholder="Username" required><input name="full_name" placeholder="Nama lengkap" required><input name="email" type="email" placeholder="Email perusahaan (untuk akses PDF)"><select name="role"><option>ADMIN</option><option>HRD</option><option>KABAG</option><option>KARYAWAN</option></select><input name="password" type="password" placeholder="Password awal (min. 12 karakter)" required><input name="employee_id" placeholder="Employee ID (untuk karyawan)"><select name="department_id"><option value="">Departemen (opsional)</option>${deps.map(d=>`<option value="${d.department_id}">${esc(d.name)}</option>`).join('')}</select><button class="primary">Simpan User</button></form></div><div class="panel"><h3>Penugasan Kepala Bagian</h3><form id="kf" class="formgrid"><select name="department_id">${deps.map(d=>`<option value="${d.department_id}">${esc(d.name)}</option>`).join('')}</select><select name="kabag_user_id">${kabags.map(k=>`<option value="${k.user_id}">${esc(k.full_name)}</option>`).join('')}</select><button class="primary">Tetapkan Kabag</button></form></div><div class="panel"><h3>Daftar User</h3><div class="tablewrap"><table><tr><th>Username</th><th>Nama</th><th>Role</th><th>Employee ID</th><th>Status</th></tr>${a.map(x=>`<tr><td>${esc(x.username)}</td><td>${esc(x.full_name)}</td><td>${esc(x.role)}</td><td>${esc(x.employee_id)}</td><td>${x.active}</td></tr>`).join('')}</table></div></div>`;$('#uf').onsubmit=async e=>{e.preventDefault();try{await call('saveUser',Object.fromEntries(new FormData(e.currentTarget)));page('users');}catch(x){alert(x.message);}};$('#kf').onsubmit=async e=>{e.preventDefault();try{await call('setDepartmentKabag',Object.fromEntries(new FormData(e.currentTarget)));alert('Kabag berhasil ditetapkan.');}catch(x){alert(x.message);}};}
async function audit(){const a=await call('auditList',{limit:150});$('#content').innerHTML=`<div class="panel"><h3>Audit Log</h3><div class="tablewrap"><table><tr><th>Waktu</th><th>User</th><th>Role</th><th>Aksi</th><th>Entitas</th></tr>${a.map(x=>`<tr><td>${esc(x.created_at)}</td><td>${esc(x.actor_user_id)}</td><td>${esc(x.actor_role)}</td><td>${esc(x.action)}</td><td>${esc(x.entity)}</td></tr>`).join('')}</table></div></div>`;}
async function backup(){const note=prompt('Catatan backup (opsional)')||'';if(!confirm('Buat salinan backup Spreadsheet sekarang?'))return;try{const d=await call('backup',{note});$('#content').innerHTML=`<div class="panel">Backup berhasil: <a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.backup.file_name)}</a></div>`;}catch(e){fail(e);}}
render();window.addEventListener('online',syncQueue);if(navigator.onLine)syncQueue();

async function syncQueue(){if(!navigator.onLine||!me()||me().role!=='KARYAWAN')return;const q=JSON.parse(localStorage.getItem('msa_leave_queue')||'[]');if(!q.length)return;const left=[];for(const item of q){try{await call('createLeave',item);}catch(e){left.push(item);}}localStorage.setItem('msa_leave_queue',JSON.stringify(left));if(q.length>left.length){const s=$('#status');if(s)s.textContent='● Online · '+(q.length-left.length)+' draft tersinkron';}}

async function passwordPage(){$('#content').innerHTML=`<div class="panel"><h3>Ganti Password</h3><form id="pf"><label>Password lama<input name="old_password" type="password" required></label><label>Password baru (minimal 12 karakter)<input name="new_password" type="password" minlength="12" required></label><button class="primary">Perbarui Password</button></form></div>`;$('#pf').onsubmit=async e=>{e.preventDefault();try{await call('changePassword',Object.fromEntries(new FormData(e.currentTarget)));alert('Password berhasil diubah.');e.currentTarget.reset();}catch(x){alert(x.message);}};}
