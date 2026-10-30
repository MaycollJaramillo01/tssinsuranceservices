export const site = {
  name: 'TSS Insurance Services',
  phone: '714-534-0070',
  phoneHref: 'tel:+17145340070',
  email: 'tssinsuranceservices@gmail.com',
  fax: '714-534-0071',
  facebook: 'https://www.facebook.com/TssInsuranceServices/',
  hours: [
    { day: 'Monday–Friday', time: '10:30 AM–7 PM' },
    { day: 'Saturday', time: '10:30 AM–3 PM' },
    { day: 'Sunday', time: 'Closed' },
  ],
  // No address or map until the original city spelling has been confirmed.
  showInsuranceBrands: false,
  insuranceBrands: [] as { name: string; image: string }[],
};

export const publicPaths = ['/', '/insurance/', '/income-tax/', '/dmv-services/', '/real-estate-mortgage/', '/business-formation/', '/our-team/', '/contact/'];
export const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true';
