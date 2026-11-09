/**
 * 100% fictional presentation records for the opt-in cubixgear demo.
 * Never load these records from a real tenant or submit demo transactions.
 */
const photoPreview = (title, subtitle, accent) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="340" viewBox="0 0 560 340">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#0e343b"/><stop offset="1" stop-color="${accent}"/>
    </linearGradient></defs>
    <rect width="560" height="340" fill="url(#bg)"/>
    <circle cx="445" cy="80" r="155" fill="#ffffff" opacity=".045"/>
    <rect x="56" y="63" width="448" height="214" rx="21" fill="#ffffff" opacity=".08"/>
    <path d="M136 190h290l-29-58a30 30 0 0 0-27-16H204a30 30 0 0 0-27 16z" fill="none" stroke="#d7f9eb" stroke-width="9" stroke-linejoin="round"/>
    <path d="M132 193h296v44H132z" fill="none" stroke="#d7f9eb" stroke-width="9" stroke-linejoin="round"/>
    <circle cx="185" cy="239" r="16" fill="#d7f9eb"/><circle cx="372" cy="239" r="16" fill="#d7f9eb"/>
    <text x="27" y="38" fill="#d7f9eb" font-family="Arial,sans-serif" font-size="17" font-weight="700">${title}</text>
    <text x="28" y="320" fill="#ffffff" opacity=".85" font-family="Arial,sans-serif" font-size="15">${subtitle} • ILLUSTRATIVE DEMO ONLY</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

export const demoBranding = Object.freeze({
  name: 'cubixgear Demo Garage',
  publicName: 'cubixgear Demo Garage',
  welcomeMessage: 'Drive confidently. We handle the details.',
  description: 'A sample workshop website showing vehicle repairs and service progress.',
  address: 'Demo Street, Sample Town',
  city: 'Sample Town',
  phone: '',
  whatsapp: '',
  hasLogo: false,
  primaryColor: '#116f69',
  secondaryColor: '#e4f2ec',
});

export const demoSession = Object.freeze({
  customer: { name: 'Demo Driver' },
  vehicles: [
    { id: 'demo-vehicle-1', registration: 'DEMO-CAR-001', model: 'City Hatchback', year: '2022' },
    { id: 'demo-vehicle-2', registration: 'DEMO-CAR-002', model: 'Compact SUV', year: '2024' },
  ],
  jobs: [
    {
      id: 'demo-job-1', number: 'DEMO-JC-001', vehicleId: 'demo-vehicle-1',
      vehicleRegistration: 'DEMO-CAR-001', vehicleModel: 'City Hatchback',
      status: 'In Progress', stage: 'work_in_progress', createdAt: '2026-11-02T10:00:00+05:30',
    },
    {
      id: 'demo-job-2', number: 'DEMO-JC-002', vehicleId: 'demo-vehicle-2',
      vehicleRegistration: 'DEMO-CAR-002', vehicleModel: 'Compact SUV',
      status: 'Ready for Delivery', stage: 'ready', createdAt: '2026-10-30T11:30:00+05:30',
    },
    {
      id: 'demo-job-3', number: 'DEMO-JC-003', vehicleId: 'demo-vehicle-1',
      vehicleRegistration: 'DEMO-CAR-001', vehicleModel: 'City Hatchback',
      status: 'Delivered', stage: 'delivered', createdAt: '2026-10-17T14:00:00+05:30',
    },
  ],
  photos: [
    {
      id: 'demo-photo-1', vehicleId: 'demo-vehicle-1', caption: 'Front inspection',
      category: 'Exterior', phase: 'Inspection', capturedAt: '2026-11-02T11:00:00+05:30',
      demoImage: photoPreview('FRONT VIEW', 'Sample inspection preview', '#216c79'),
    },
    {
      id: 'demo-photo-2', vehicleId: 'demo-vehicle-2', caption: 'Body work update',
      category: 'Body', phase: 'Work', capturedAt: '2026-10-31T12:30:00+05:30',
      demoImage: photoPreview('WORK UPDATE', 'Sample work photo preview', '#4c7761'),
    },
  ],
  estimates: [
    { jobId: 'demo-job-1', version: 1, status: 'Approved', total: 4850 },
  ],
  invoices: [
    { jobId: 'demo-job-3', number: 'DEMO-INV-003', status: 'Paid', total: 2360 },
  ],
});
