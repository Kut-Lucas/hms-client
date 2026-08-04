// Multicare Hospital — procedures and lab test price catalog
// Prices in KES. Ranges given as [min, max]; fixed prices as [price, price].

export const PROCEDURES = [
  { name: 'Dressing', minPrice: 300, maxPrice: 1000 },
  { name: 'Delivery', minPrice: 10000, maxPrice: 10000 },
  { name: 'Circumcision – Adult', minPrice: 5000, maxPrice: 5000 },
  { name: 'Circumcision – Child', minPrice: 2000, maxPrice: 2000 },
  { name: 'Stitching', minPrice: 600, maxPrice: 3000 },
  { name: 'Incision & Drainage', minPrice: 300, maxPrice: 2000 },
  { name: 'Nebulization – Adult', minPrice: 700, maxPrice: 2000 },
  { name: 'Nebulization – Child', minPrice: 500, maxPrice: 500 },
  { name: 'Ear Syringing', minPrice: 700, maxPrice: 2000 },
  { name: 'Foreign Body Removal', minPrice: 700, maxPrice: 700 },
  { name: 'Observation', minPrice: 800, maxPrice: 1000 },
  { name: 'Manual Vacuum Aspiration (MVA)', minPrice: 5000, maxPrice: 15000 },
  { name: 'IM Injection', minPrice: 100, maxPrice: 100 },
  { name: 'IV Injection', minPrice: 200, maxPrice: 200 },
  { name: 'S/C Injection', minPrice: 100, maxPrice: 100 },
  { name: 'Catheterization', minPrice: 500, maxPrice: 500 },
];

export const LAB_TESTS = [
  { name: 'FHG (Full Hemogram)', minPrice: 400, maxPrice: 1000 },
  { name: 'Stool Analysis', minPrice: 150, maxPrice: 150 },
  { name: 'SATE', minPrice: 0, maxPrice: 0 },
  { name: 'H. Pylori Antibody', minPrice: 450, maxPrice: 450 },
  { name: 'H. Pylori Antigen', minPrice: 600, maxPrice: 600 },
  { name: 'SAT Antibody', minPrice: 450, maxPrice: 450 },
  { name: 'SAT Antigen', minPrice: 600, maxPrice: 600 },
  { name: 'MRDT', minPrice: 200, maxPrice: 200 },
  { name: 'B/S for Malaria Parasites', minPrice: 200, maxPrice: 200 },
  { name: 'Haemoglobin', minPrice: 200, maxPrice: 200 },
  { name: 'PDT Serum', minPrice: 400, maxPrice: 600 },
  { name: 'Urine', minPrice: 100, maxPrice: 100 },
  { name: 'Blood Group', minPrice: 200, maxPrice: 200 },
  { name: 'Urinalysis – Dipstick', minPrice: 150, maxPrice: 150 },
  { name: 'Urinalysis – Microscopy', minPrice: 200, maxPrice: 200 },
  { name: 'Seminalysis', minPrice: 6500, maxPrice: 6500 },
  { name: 'DNA Test', minPrice: 80000, maxPrice: 80000 },
  { name: 'Rheumatoid Factor', minPrice: 400, maxPrice: 800 },
];
