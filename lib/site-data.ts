// lib/site-data.ts
//
// All placeholder content for the demonstration site lives here, so pages stay
// presentational. Replacing this with real data means changing this file
// rather than five page components.

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/clinics', label: 'Our Clinics' },
  { href: '/practitioners', label: 'Practitioners' },
];

export type Clinic = {
  slug: string;
  name: string;
  suburb: string;
  address: string;
  phone: string;
  hours: { days: string; time: string }[];
  nextAvailable: string;
  availability: 'open' | 'limited' | 'full';
  note: string;
  parking: string;
};

export const CLINICS: Clinic[] = [
  {
    slug: 'chermside',
    name: 'Silverline Chermside',
    suburb: 'Chermside',
    address: '412 Gympie Road, Chermside QLD 4032',
    phone: '07 3000 0010',
    hours: [
      { days: 'Mon – Fri', time: '7:30am – 6:00pm' },
      { days: 'Saturday', time: '8:00am – 1:00pm' },
      { days: 'Sunday', time: 'Closed' },
    ],
    nextAvailable: 'Today, 2:40pm',
    availability: 'open',
    note: 'Our largest site, with on-site pathology and a dedicated treatment room.',
    parking: 'Free undercover parking, entry via Farrington Street',
  },
  {
    slug: 'south-bank',
    name: 'Silverline South Bank',
    suburb: 'South Bank',
    address: '9 Little Stanley Street, South Brisbane QLD 4101',
    phone: '07 3000 0020',
    hours: [
      { days: 'Mon – Fri', time: '8:00am – 7:00pm' },
      { days: 'Saturday', time: '9:00am – 2:00pm' },
      { days: 'Sunday', time: 'Closed' },
    ],
    nextAvailable: 'Tomorrow, 9:15am',
    availability: 'limited',
    note: 'Extended weekday hours for people working in the CBD.',
    parking: 'Paid parking at South Bank car park, 3 minute walk',
  },
  {
    slug: 'toowong',
    name: 'Silverline Toowong',
    suburb: 'Toowong',
    address: '55 Sherwood Road, Toowong QLD 4066',
    phone: '07 3000 0030',
    hours: [
      { days: 'Mon – Fri', time: '8:00am – 5:30pm' },
      { days: 'Saturday', time: 'Closed' },
      { days: 'Sunday', time: 'Closed' },
    ],
    nextAvailable: 'Thu 11 Sep, 10:00am',
    availability: 'full',
    note: 'Smaller practice with a focus on continuity of care.',
    parking: 'Street parking on Sherwood Road, 2 hour limit',
  },
];

export type Service = {
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  billing: string;
  duration: string;
};

export const SERVICES: Service[] = [
  {
    slug: 'general-practice',
    name: 'General practice',
    summary:
      'Everyday medical care, from acute illness to ongoing management of long-term conditions.',
    includes: [
      'Standard and long consultations',
      'Prescriptions and repeat scripts',
      'Referrals to specialists and allied health',
      'Medical certificates',
    ],
    billing: 'Bulk billed for concession card holders and under 16s',
    duration: '15 or 30 minutes',
  },
  {
    slug: 'chronic-disease',
    name: 'Chronic disease management',
    summary:
      'Structured, planned care for conditions that need coordination across several providers.',
    includes: [
      'GP Management Plans and Team Care Arrangements',
      'Coordination with allied health under Medicare',
      'Scheduled review appointments',
      'Shared care with treating specialists',
    ],
    billing: 'Medicare rebates apply to eligible care plans',
    duration: '45 minutes for the initial plan',
  },
  {
    slug: 'preventive-health',
    name: 'Preventive health',
    summary: 'Screening and health checks timed to age, family history and risk factors.',
    includes: [
      'Health assessments at 45–49 and 75+',
      'Cervical screening and breast health',
      'Skin checks with dermoscopy',
      'Cardiovascular and diabetes risk screening',
    ],
    billing: 'Most health assessments are bulk billed',
    duration: '30 to 45 minutes',
  },
  {
    slug: 'travel-immunisation',
    name: 'Travel and immunisation',
    summary: 'Vaccinations on the national schedule, plus destination-specific travel advice.',
    includes: [
      'Childhood and adult immunisation schedule',
      'Influenza and COVID-19 vaccination',
      'Travel consultations with destination risk advice',
      'Yellow fever vaccination certificates',
    ],
    billing: 'Consultation billed separately from vaccine cost',
    duration: '20 minutes, 40 for travel consults',
  },
  {
    slug: 'mental-health',
    name: 'Mental health',
    summary: 'Assessment, treatment planning and referral, with review built into the plan.',
    includes: [
      'Mental Health Treatment Plans',
      'Referral to psychologists and psychiatrists',
      'Review appointments after six sessions',
      'Support for carers and family members',
    ],
    billing: 'Medicare rebates for up to 10 sessions per calendar year',
    duration: '45 minutes for the initial plan',
  },
  {
    slug: 'telehealth',
    name: 'Telehealth',
    summary: 'Phone and video consultations for follow-ups, results and repeat prescriptions.',
    includes: [
      'Video consultations with your usual GP',
      'Discussion of test results',
      'Repeat prescriptions sent electronically',
      'Referral renewals',
    ],
    billing: 'Rebates apply if you have seen us in the last 12 months',
    duration: '15 minutes',
  },
];

export type Practitioner = {
  slug: string;
  name: string;
  credentials: string;
  role: string;
  clinics: string[];
  interests: string[];
  languages: string[];
  nextAvailable: string;
  bio: string;
};

export const PRACTITIONERS: Practitioner[] = [
  {
    slug: 'amara-osei',
    name: 'Dr Amara Osei',
    credentials: 'MBBS, FRACGP',
    role: 'General Practitioner',
    clinics: ['Chermside', 'South Bank'],
    interests: ["Women's health", 'Chronic disease', 'Paediatrics'],
    languages: ['English', 'Twi'],
    nextAvailable: 'Today, 3:20pm',
    bio: 'Amara has worked in general practice in Brisbane since 2014, with a particular interest in continuity of care for families.',
  },
  {
    slug: 'daniel-whitcombe',
    name: 'Dr Daniel Whitcombe',
    credentials: 'MBBS, FRACGP, DCH',
    role: 'General Practitioner',
    clinics: ['Chermside'],
    interests: ['Skin cancer medicine', 'Minor procedures', 'Chronic pain'],
    languages: ['English'],
    nextAvailable: 'Tomorrow, 8:45am',
    bio: 'Daniel holds a Diploma of Child Health and runs our skin check and minor procedures clinic on Wednesdays.',
  },
  {
    slug: 'priya-raghavan',
    name: 'Dr Priya Raghavan',
    credentials: 'MBBS, FRACGP',
    role: 'General Practitioner',
    clinics: ['South Bank', 'Toowong'],
    interests: ['Mental health', 'Adolescent health', 'Preventive care'],
    languages: ['English', 'Tamil', 'Hindi'],
    nextAvailable: 'Mon 8 Sep, 11:30am',
    bio: 'Priya has additional training in adolescent mental health and works closely with our psychology partners.',
  },
  {
    slug: 'siobhan-clarke',
    name: 'Siobhan Clarke',
    credentials: 'RN, MN',
    role: 'Practice Nurse',
    clinics: ['Chermside', 'Toowong'],
    interests: ['Wound care', 'Immunisation', 'Health assessments'],
    languages: ['English'],
    nextAvailable: 'Today, 1:00pm',
    bio: 'Siobhan coordinates our immunisation program and conducts health assessments for patients over 75.',
  },
  {
    slug: 'marcus-tan',
    name: 'Dr Marcus Tan',
    credentials: 'MBBS, FRACGP, MPH',
    role: 'General Practitioner',
    clinics: ['Toowong'],
    interests: ['Travel medicine', 'Infectious disease', 'Refugee health'],
    languages: ['English', 'Mandarin', 'Malay'],
    nextAvailable: 'Wed 10 Sep, 2:00pm',
    bio: 'Marcus holds a Master of Public Health and leads our travel medicine and refugee health services.',
  },
  {
    slug: 'helen-baptiste',
    name: 'Dr Helen Baptiste',
    credentials: 'MBBS, FRACGP',
    role: 'General Practitioner',
    clinics: ['South Bank'],
    interests: ['Older persons health', 'Palliative care', 'Dementia'],
    languages: ['English', 'French'],
    nextAvailable: 'Fri 5 Sep, 9:00am',
    bio: 'Helen provides in-home visits for housebound patients in the inner south and works with local palliative care teams.',
  },
];

export const NEW_PATIENT_FACTS = [
  { term: 'Standard consultation', detail: '15 minutes' },
  { term: 'Long consultation', detail: '30 minutes' },
  { term: 'Bulk billing', detail: 'Concession & under 16' },
  { term: 'Telehealth', detail: 'Existing patients' },
];
