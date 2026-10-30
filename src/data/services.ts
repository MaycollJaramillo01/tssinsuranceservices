export interface Service {
  slug: string;
  name: string;
  icon: string;
  short: string;
  linkLabel: string;
  intro: string;
  items: string[];
  detailTitle: string;
  details: string[];
  cta: string;
  related: string[];
  image?: string;
  alt?: string;
  meta: string;
}

export const services: Service[] = [
  {
    slug: 'insurance', name: 'Insurance', icon: 'shield-check',
    short: 'Auto, home and commercial coverage. Talk through your insurance needs with our team.',
    linkLabel: 'Explore insurance',
    intro: 'Find help with auto, home and commercial insurance in one place. TSS also offers liability and non-owner insurance options. Contact the team to discuss your needs, ask about available coverage and get information about the next steps for your situation.',
    items: ['Auto insurance', 'Home insurance', 'Commercial insurance', 'Liability coverage', 'Non-owner insurance'],
    detailTitle: 'Start with your insurance questions',
    details: ['Have a question about SR-22 or a DUI-related insurance matter? Ask the team about your situation. These are matters to discuss, rather than names of insurance policies.', 'The published offer includes monthly, semiannual and annual payment arrangements. Ask which options are available for the coverage you are considering.'],
    cta: 'Ask About Insurance', related: ['dmv-services', 'business-formation'],
    meta: 'Explore auto, home, commercial, liability and non-owner insurance with TSS Insurance Services. Call 714-534-0070 to discuss your needs.',
  },
  {
    slug: 'income-tax', name: 'Income Tax', icon: 'receipt-tax',
    short: 'Tax preparation for individuals, businesses and the self-employed, with e-file and direct deposit options.',
    linkLabel: 'Explore tax services',
    intro: 'Get support with personal and business tax preparation, including services for self-employed individuals and small businesses. TSS offers short and long form preparation, electronic filing and direct deposit options. You can also contact the team to ask about preparing your taxes online and discuss the service you need.',
    items: ['Personal income tax preparation', 'Business tax preparation', 'Self-employed tax preparation', 'Small business tax preparation', 'Short and long forms', 'Electronic filing (e-file)', 'Direct deposit'],
    detailTitle: 'Ask about preparing your taxes online',
    details: ['Contact the team to ask about online tax preparation and how to get started. The right filing approach depends on your circumstances.', 'Use the general inquiry form for questions only. Do not send Social Security numbers, tax documents or banking details. Refund amounts and timing are not guaranteed.'],
    cta: 'Ask About Tax Preparation', related: ['business-formation', 'insurance'], image: 'tax-preparation',
    alt: 'Financial paperwork and a calculator used for tax preparation',
    meta: 'Personal, business, self-employed and small business tax preparation at TSS. Ask about e-file, direct deposit and online preparation.',
  },
  {
    slug: 'dmv-services', name: 'DMV Services', icon: 'car',
    short: 'Help with registrations, renewals, transfers, plates and titles for your vehicle or watercraft.',
    linkLabel: 'Explore DMV services',
    intro: 'TSS provides assistance with vehicle registrations and renewals for automobiles, motorcycles and watercraft. You can also ask about transfers, replacement plates, new titles and replacement stickers. Contact the team to discuss the transaction you need help with and find out more about the services available.',
    items: ['Vehicle registrations', 'Registration renewals', 'Transfers', 'Replacement plates', 'New titles', 'Replacement stickers', 'Automobiles, motorcycles and watercraft'],
    detailTitle: 'Tell us about your vehicle transaction',
    details: ['Whether you need a renewal or help with a transfer, call or send a general inquiry describing the service you are looking for.', 'TSS Insurance Services is a business providing DMV-related assistance. This website is not a government website.'],
    cta: 'Ask About DMV Services', related: ['insurance', 'income-tax'],
    meta: 'Ask TSS about registrations, renewals, transfers, replacement plates, titles and stickers for automobiles, motorcycles and watercraft.',
  },
  {
    slug: 'real-estate-mortgage', name: 'Real Estate & Mortgage', icon: 'home',
    short: 'Support for home purchases and refinancing, with information on available mortgage programs.',
    linkLabel: 'Explore real estate & mortgage',
    intro: 'Explore help with residential real estate, home purchases and mortgage refinancing. The published TSS offer includes conventional, FHA, VA and USDA loan programs, subject to availability. Speak with the team about your plans and ask which services and program options may be available for your situation.',
    items: ['Residential real estate', 'Home purchases', 'Mortgage refinancing', 'Conventional loans', 'FHA programs', 'VA programs', 'USDA programs'],
    detailTitle: 'A conversation about your next move',
    details: ['German Abril works in real estate and mortgage loans. Contact the team to discuss a purchase or refinance and ask about the options currently available.', 'Program availability, eligibility and terms must be discussed with the team. No rates, savings or approval outcomes are promised on this website.'],
    cta: 'Ask About Real Estate & Mortgage', related: ['insurance', 'income-tax'], image: 'home-purchase',
    alt: 'Keys and a house model representing a home purchase',
    meta: 'Explore residential real estate, home purchase and refinancing assistance at TSS. Ask about conventional, FHA, VA and USDA programs.',
  },
  {
    slug: 'business-formation', name: 'Business Formation', icon: 'building',
    short: 'Support for structuring an LLC, partnership or corporation. Discuss your business plans with us.',
    linkLabel: 'Explore business formation',
    intro: 'Planning a business entity? TSS offers support for structuring an LLC, partnership or corporation. Start by telling the team what you have in mind and asking about the assistance available. The scope of support and the next steps can be discussed directly with the team.',
    items: ['Limited liability companies (LLCs)', 'Partnerships', 'Corporations'],
    detailTitle: 'Begin with your business plans',
    details: ['Ask the team about support for the type of entity you are considering. The published service covers help with structuring LLCs, partnerships and corporations.', 'Contact TSS to discuss the scope of assistance. Prices, timelines and specific deliverables are not listed, and legal advice is not offered through this website.'],
    cta: 'Ask About Business Formation', related: ['income-tax', 'insurance'],
    meta: 'Ask TSS Insurance Services about support for structuring an LLC, partnership or corporation. Call 714-534-0070 to discuss your business plans.',
  },
];

export const serviceOptions = [...services.map(({ slug, name }) => ({ value: slug, label: name })), { value: 'general', label: 'General inquiry' }];
