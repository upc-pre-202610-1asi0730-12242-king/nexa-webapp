export const CATALOG_BRANDS = [
  'Paysan Breton',
  'Le Charcutier',
  'Cavour',
  'Gestam',
  'Green Island',
  'Agriform',
  'Sancho Panza',
  'Sterilgarda',
];

const brandLogoMap = {
  'Agriform': '/brand-logos/logo-agriform.png',
  'Cavour': '/brand-logos/logo-cavour.png',
  'Gestam': '/brand-logos/logo-gestam.png',
  'Green Island': '/brand-logos/logo-green-island.png',
  'Happy Cow': '/brand-logos/logo-happy-cow.png',
  'Le Charcutier': '/brand-logos/logo-le-charcutier.png',
  'Le Fromelier': '/brand-logos/logo-le-fromelier.png',
  'Paysan Breton': '/brand-logos/logo-paysan-breton.png',
  'Sancho Panza': '/brand-logos/logo-sancho-panza.png',
  'Sterilgarda': '/brand-logos/logo-sterilgarda.png',
};

const brandMatchers = [
  ['Paysan Breton', ['paysan', 'breton', 'butter', 'brie', 'camembert']],
  ['Le Charcutier', ['charcutier', 'ham', 'prosciutto', 'salami', 'mortadella']],
  ['Cavour', ['cavour', 'coppa', 'salam', 'mortadell']],
  ['Gestam', ['gestam', 'gouda', 'edam', 'queso', 'cheese']],
  ['Green Island', ['green island', 'blue cheese', 'roquefort']],
  ['Agriform', ['agriform', 'parmesan', 'grana', 'parmigiano']],
  ['Sancho Panza', ['sancho', 'manchego', 'iberico']],
  ['Sterilgarda', ['sterilgarda', 'milk', 'cream', 'dairy']],
];

export function brandForProduct(product = {}) {
  if (product.brand) return product.brand;
  if (product.brandName) return product.brandName;
  if (product.manufacturer) return product.manufacturer;
  const haystack = [
    product.name,
    product.sku,
    product.category,
    product.description,
  ].filter(Boolean).join(' ').toLowerCase();

  const matched = brandMatchers.find(([, terms]) => terms.some(term => haystack.includes(term)));
  return matched?.[0] || 'Brand pending';
}

export function logoForProduct(product = {}) {
  return brandLogoMap[brandForProduct(product)] || '';
}
