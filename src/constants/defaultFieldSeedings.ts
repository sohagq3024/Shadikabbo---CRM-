export interface CrmFieldCategoryMeta {
  key: keyof CrmFieldSeedings;
  label: string;
  icon: string;
  description: string;
  connectedSections: string[];
}

export interface CrmFieldSeedings {
  professions: string[];
  qualifications: string[];
  maritalStatuses: string[];
  heights: string[];
  genders: string[];
  religions: string[];
  bodyColors: string[];
  bloodGroups: string[];
  packages: string[];
  packagePrices?: Record<string, number>;
  jobTypes: string[];
  cities: string[];
  countries: string[];
  leadCategories: string[];
}

export interface AgencySettings {
  agencyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

export const DEFAULT_FIELD_SEEDINGS: CrmFieldSeedings = {
  professions: [
    'Doctor',
    'Software Engineer',
    'Civil Engineer',
    'Electrical Engineer',
    'Banker',
    'Business Owner',
    'Government Service',
    'University Lecturer',
    'Teacher',
    'Chartered Accountant',
    'Lawyer',
    'Defense Officer',
    'Architect',
    'Private Service',
    'Aviation Pilot',
    'Data Scientist',
    'Other',
  ],
  qualifications: [
    'SSC / O-Level',
    'HSC / A-Level',
    "Bachelor's / Honors",
    "Master's Degree",
    'MBBS / Medical',
    'B.Sc Engineering',
    'MBA / BBA',
    'PhD / Doctorate',
    'Diploma',
    'Fazil / Kamil / Madrasa',
    'Other',
  ],
  maritalStatuses: [
    'Never Married',
    'Divorced',
    'Widowed',
    'Awaiting Divorce',
  ],
  heights: [
    '4\'8" (142 cm)',
    '4\'9" (145 cm)',
    '4\'10" (147 cm)',
    '4\'11" (150 cm)',
    '5\'0" (152 cm)',
    '5\'1" (155 cm)',
    '5\'2" (157 cm)',
    '5\'3" (160 cm)',
    '5\'4" (163 cm)',
    '5\'5" (165 cm)',
    '5\'6" (168 cm)',
    '5\'7" (170 cm)',
    '5\'8" (173 cm)',
    '5\'9" (175 cm)',
    '5\'10" (178 cm)',
    '5\'11" (180 cm)',
    '6\'0" (183 cm)',
    '6\'1" (185 cm)',
    '6\'2"+ (188+ cm)',
  ],
  genders: [
    'Male',
    'Female',
  ],
  religions: [
    'Islam (Sunni)',
    'Islam (Shia)',
    'Islam (Other)',
    'Hinduism',
    'Christianity',
    'Buddhism',
    'Other',
  ],
  bodyColors: [
    'Fair',
    'Very Fair',
    'Wheatish',
    'Dusky',
    'Dark',
  ],
  bloodGroups: [
    'A+',
    'A-',
    'B+',
    'B-',
    'O+',
    'O-',
    'AB+',
    'AB-',
  ],
  packages: [
    'Standard',
    'Premium',
    'Gold',
    'Platinum',
    'VIP Royal',
    'Diamond',
  ],
  packagePrices: {
    'Standard': 10000,
    'Premium': 15000,
    'Gold': 25000,
    'Platinum': 50000,
    'VIP Royal': 100000,
    'Diamond': 35000,
  },
  jobTypes: [
    'Private Job',
    'Government Job',
    'Multinational (MNC)',
    'Own Business',
    'Freelancing / Remote',
    'Part Time',
    'Non-Employed',
    'Other',
  ],
  cities: [
    'Dhaka',
    'Chittagong',
    'Sylhet',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Rangpur',
    'Mymensingh',
    'Comilla',
    'Gazipur',
    'Narayanganj',
    'Bogra',
    'Cox\'s Bazar',
    'Feni',
    'Jessore',
    'Dinajpur',
    'Tangail',
    'Brahmanbaria',
    'Kushtia',
    'Pabna',
    'Noakhali',
    'Faridpur',
    'London',
    'New York',
    'Toronto',
    'Sydney',
    'Dubai',
    'Riyadh',
    'Kuala Lumpur',
    'Singapore',
    'Other',
  ],
  countries: [
    'Bangladesh',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'United Arab Emirates',
    'Saudi Arabia',
    'Malaysia',
    'Singapore',
    'Italy',
    'Germany',
    'Qatar',
    'Kuwait',
    'Oman',
    'France',
    'Sweden',
    'Japan',
    'Other',
  ],
  leadCategories: [
    'FB Message',
    'FB Call',
    'FB Comment',
    'Call center',
    'Reference',
    'Others source',
  ],
};

export const FIELD_CATEGORIES_META: CrmFieldCategoryMeta[] = [
  {
    key: 'leadCategories',
    label: 'Source',
    icon: 'Layers',
    description: 'Inbound lead source acquisition channels (FB Message, FB Call, FB Comment, Call center, Reference, Others source)',
    connectedSections: ['Lead Table (Source)', 'Add Lead Form (Step 1)', 'Lead Profile'],
  },
  {
    key: 'professions',
    label: 'Profession',
    icon: 'Briefcase',
    description: 'Dynamic profession and occupation choices for candidate and lead profiles',
    connectedSections: ['Client Filter', 'Paid Client Filter', 'Add Client Form', 'Add Lead Form'],
  },
  {
    key: 'qualifications',
    label: 'Qualification',
    icon: 'GraduationCap',
    description: 'Educational degrees and qualifications across matching and bio-data profiles',
    connectedSections: ['Client Filter', 'Paid Client Filter', 'Add Client Form', 'Add Lead Form'],
  },
  {
    key: 'cities',
    label: 'Cities & Districts',
    icon: 'MapPin',
    description: 'Selectable city and district choices for Present City and Permanent City (CT)',
    connectedSections: ['Client Form (Present & Permanent)', 'Lead Form (Present & Permanent)', 'Profile View'],
  },
  {
    key: 'countries',
    label: 'Countries',
    icon: 'Globe',
    description: 'Selectable country choices for local and overseas candidates and leads',
    connectedSections: ['Client Form (Present & Permanent)', 'Lead Form (Present & Permanent)', 'Profile View'],
  },
  {
    key: 'maritalStatuses',
    label: 'Marital Status',
    icon: 'Heart',
    description: 'Marital status options for profile categorization and matchmaking filters',
    connectedSections: ['Client Form', 'Add Lead Form', 'Profile View'],
  },
  {
    key: 'heights',
    label: 'Height',
    icon: 'Ruler',
    description: 'Candidate height options with standard foot-inch and metric centimeters',
    connectedSections: ['Client Form', 'Add Lead Form'],
  },
  {
    key: 'genders',
    label: 'Gender',
    icon: 'Users',
    description: 'Candidate gender categories',
    connectedSections: ['Paid Client Filter', 'Client Form', 'Add Lead Form'],
  },
  {
    key: 'religions',
    label: 'Religion',
    icon: 'BookOpen',
    description: 'Candidate religious affiliation and denomination choices',
    connectedSections: ['Client Form', 'Add Lead Form'],
  },
  {
    key: 'bodyColors',
    label: 'Complexion / Skin Tone',
    icon: 'Palette',
    description: 'Complexion and skin tone selection options',
    connectedSections: ['Client Form', 'Add Lead Form'],
  },
  {
    key: 'bloodGroups',
    label: 'Blood Group',
    icon: 'Activity',
    description: 'Medical blood group selection choices',
    connectedSections: ['Client Form', 'Add Lead Form'],
  },
  {
    key: 'packages',
    label: 'Membership Packages',
    icon: 'Crown',
    description: 'CRM matrimonial service packages and client membership tiers',
    connectedSections: ['Client Payment Form', 'Payment Requests', 'Invoice'],
  },
  {
    key: 'jobTypes',
    label: 'Job Type',
    icon: 'Building2',
    description: 'Employment nature (Private, Government, MNC, Business, Remote, etc.)',
    connectedSections: ['Client Form', 'Add Lead Form'],
  },
];

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: 'ShadiKabbo Matrimony',
  tagline: 'Premium Matrimony & Matchmaking CRM',
  phone: '+880 1723-867646',
  email: 'info@shadikabbo.com',
  address: 'Level 4, House 12, Road 90, Gulshan-2, Dhaka-1212, Bangladesh',
  currency: 'BDT (৳)',
  timezone: 'Asia/Dhaka (GMT+6)',
  dateFormat: 'DD/MM/YYYY',
};
