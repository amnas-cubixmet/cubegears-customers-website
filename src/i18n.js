export const copy = {
  en:{
    portal:'Customer Portal', home:'Home', greeting:'Your service updates, all in one place.',
    welcome:'Welcome to', label:'Customer Website', contact:'Contact Workshop',
    call:'Call now', whatsapp:'WhatsApp', accessTitle:'Private customer access',
    accessDescription:'Your vehicles and service records are protected. Open the secure link sent by your workshop to view your information.',
    accessNote:'Need your link? Contact the workshop. No registration or OTP is required.',
    safe:'Your customer information is private and protected.',
    signing:'Opening your secure portal…', loading:'Loading…', retry:'Try again',
    invalid:'This access link is invalid, expired, or revoked.', unavailable:'The portal is temporarily unavailable.',
    logout:'Log out', vehicles:'My Vehicles', active:'Active Job Cards', history:'Service History',
    photos:'Published Inspection Photos', documents:'Estimates & Invoices', noData:'No records to show yet.',
    nonePhotos:'No photos have been published yet.', date:'Service Date', amount:'Total', all:'All vehicles',
    received:'Vehicle received', inspection:'Inspection', inspection_completed:'Inspection completed',
    work_started:'Work started', work_in_progress:'Work in progress', quality_check:'Quality check',
    ready:'Ready for delivery', delivered:'Delivered', step:'Service Progress',
    onlyPublished:'Only photos intentionally shared by the workshop will appear here.',
    status:'Status', security:'Your customer session is protected by secure browser cookies.',
    footer:'Powered by CubeGears'
  },
  ml:{
    portal:'കസ്റ്റമർ പോർട്ടൽ', home:'ഹോം', greeting:'നിങ്ങളുടെ വാഹന സർവീസ് വിവരങ്ങൾ ഒരിടത്ത്.',
    welcome:'സ്വാഗതം', label:'കസ്റ്റമർ വെബ്സൈറ്റ്', contact:'വർക്ക്‌ഷോപ്പുമായി ബന്ധപ്പെടുക',
    call:'വിളിക്കുക', whatsapp:'വാട്സ്ആപ്പ്', accessTitle:'സ്വകാര്യ കസ്റ്റമർ ആക്സസ്',
    accessDescription:'നിങ്ങളുടെ വാഹന വിവരങ്ങൾ സുരക്ഷിതമാണ്. വർക്ക്‌ഷോപ്പ് അയച്ച ലിങ്ക് തുറന്നാൽ സർവീസ് വിവരങ്ങൾ കാണാം.',
    accessNote:'ലിങ്ക് കിട്ടിയില്ലേ? വർക്ക്‌ഷോപ്പുമായി ബന്ധപ്പെടുക. രജിസ്ട്രേഷനോ OTP-യോ വേണ്ട.',
    safe:'നിങ്ങളുടെ കസ്റ്റമർ വിവരങ്ങൾ സ്വകാര്യവും സുരക്ഷിതവുമാണ്.',
    signing:'സുരക്ഷിത പോർട്ടൽ തുറക്കുന്നു…', loading:'ലോഡ് ചെയ്യുന്നു…', retry:'വീണ്ടും ശ്രമിക്കുക',
    invalid:'ഈ ലിങ്ക് അസാധുവാണ്, കാലഹരണപ്പെട്ടു, അല്ലെങ്കിൽ റദ്ദാക്കിയിരിക്കുന്നു.', unavailable:'പോർട്ടൽ താൽക്കാലികമായി ലഭ്യമല്ല.',
    logout:'ലോഗൗട്ട്', vehicles:'എന്റെ വാഹനങ്ങൾ', active:'നിലവിലെ ജോബ് കാർഡുകൾ', history:'സർവീസ് ചരിത്രം',
    photos:'പ്രസിദ്ധീകരിച്ച പരിശോധന ഫോട്ടോകൾ', documents:'എസ്റ്റിമേറ്റുകളും ഇൻവോയ്സുകളും',
    noData:'ഇപ്പോൾ വിവരങ്ങളൊന്നുമില്ല.', nonePhotos:'ഫോട്ടോകൾ ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല.',
    date:'സർവീസ് തീയതി', amount:'ആകെ', all:'എല്ലാ വാഹനങ്ങളും',
    received:'വാഹനം സ്വീകരിച്ചു', inspection:'പരിശോധന', inspection_completed:'പരിശോധന പൂർത്തിയായി',
    work_started:'പണി തുടങ്ങി', work_in_progress:'പണി നടക്കുന്നു', quality_check:'ഗുണനിലവാര പരിശോധന',
    ready:'ഡെലിവറിക്ക് തയ്യാറായി', delivered:'കൈമാറി', step:'സർവീസ് പുരോഗതി',
    onlyPublished:'വർക്ക്‌ഷോപ്പ് പ്രസിദ്ധീകരിച്ച ഫോട്ടോകൾ മാത്രമാണ് കാണിക്കുന്നത്.',
    status:'നില', security:'സുരക്ഷിത ബ്രൗസർ കുക്കി ഉപയോഗിച്ചാണ് കസ്റ്റമർ സെഷൻ പ്രവർത്തിക്കുന്നത്.',
    footer:'CubeGears'
  }
};
export const stages=['received','inspection','inspection_completed','work_started','work_in_progress','quality_check','ready','delivered'];
export const inProgress=new Set(['New','Inspection','Estimate Pending','Approved','In Progress','Waiting for Parts','QC','Ready for Delivery']);
export const niceDate=(date,lang)=>{
  if(!date)return '—';
  const parsed=new Date(date);
  return isNaN(parsed.getTime())?'—':parsed.toLocaleDateString(lang==='ml'?'ml-IN':'en-IN',{year:'numeric',month:'short',day:'numeric'});
};
export const rupees=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(value)||0);
export const cleanPhone=value=>String(value||'').replace(/[^\d+]/g,'');
