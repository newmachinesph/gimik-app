/**
 * Where a person is, for an app that only runs in the Philippines.
 *
 * Cities and municipalities people actually name when asked where they live —
 * the country's major population centres across every region, not the full
 * gazetteer of 1,600 municipalities. Grouped by island region so a list of
 * sixty reads in three short scans rather than one long one.
 *
 * Kept as plain data; a person's own city is stored as the string, so this list
 * can grow without touching anything already saved.
 */
export type CityRegion = 'Luzon' | 'Visayas' | 'Mindanao';

export type City = { name: string; province: string; region: CityRegion };

export const PH_CITIES: City[] = [
  // Luzon
  { name: 'Manila', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Quezon City', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Makati', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Taguig', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Pasig', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Mandaluyong', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Parañaque', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Pasay', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Marikina', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Caloocan', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Las Piñas', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Muntinlupa', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Valenzuela', province: 'Metro Manila', region: 'Luzon' },
  { name: 'San Juan', province: 'Metro Manila', region: 'Luzon' },
  { name: 'Antipolo', province: 'Rizal', region: 'Luzon' },
  { name: 'Cainta', province: 'Rizal', region: 'Luzon' },
  { name: 'Bacoor', province: 'Cavite', region: 'Luzon' },
  { name: 'Dasmariñas', province: 'Cavite', region: 'Luzon' },
  { name: 'Imus', province: 'Cavite', region: 'Luzon' },
  { name: 'Tagaytay', province: 'Cavite', region: 'Luzon' },
  { name: 'Santa Rosa', province: 'Laguna', region: 'Luzon' },
  { name: 'Calamba', province: 'Laguna', region: 'Luzon' },
  { name: 'San Pablo', province: 'Laguna', region: 'Luzon' },
  { name: 'Batangas City', province: 'Batangas', region: 'Luzon' },
  { name: 'Lipa', province: 'Batangas', region: 'Luzon' },
  { name: 'Lucena', province: 'Quezon', region: 'Luzon' },
  { name: 'San Fernando', province: 'Pampanga', region: 'Luzon' },
  { name: 'Angeles', province: 'Pampanga', region: 'Luzon' },
  { name: 'Olongapo', province: 'Zambales', region: 'Luzon' },
  { name: 'Malolos', province: 'Bulacan', region: 'Luzon' },
  { name: 'Cabanatuan', province: 'Nueva Ecija', region: 'Luzon' },
  { name: 'Tarlac City', province: 'Tarlac', region: 'Luzon' },
  { name: 'Dagupan', province: 'Pangasinan', region: 'Luzon' },
  { name: 'Baguio', province: 'Benguet', region: 'Luzon' },
  { name: 'Vigan', province: 'Ilocos Sur', region: 'Luzon' },
  { name: 'Laoag', province: 'Ilocos Norte', region: 'Luzon' },
  { name: 'Tuguegarao', province: 'Cagayan', region: 'Luzon' },
  { name: 'Legazpi', province: 'Albay', region: 'Luzon' },
  { name: 'Naga', province: 'Camarines Sur', region: 'Luzon' },
  { name: 'Puerto Princesa', province: 'Palawan', region: 'Luzon' },
  { name: 'Calapan', province: 'Oriental Mindoro', region: 'Luzon' },
  // Visayas
  { name: 'Cebu City', province: 'Cebu', region: 'Visayas' },
  { name: 'Mandaue', province: 'Cebu', region: 'Visayas' },
  { name: 'Lapu-Lapu', province: 'Cebu', region: 'Visayas' },
  { name: 'Talisay', province: 'Cebu', region: 'Visayas' },
  { name: 'Iloilo City', province: 'Iloilo', region: 'Visayas' },
  { name: 'Bacolod', province: 'Negros Occidental', region: 'Visayas' },
  { name: 'Dumaguete', province: 'Negros Oriental', region: 'Visayas' },
  { name: 'Tacloban', province: 'Leyte', region: 'Visayas' },
  { name: 'Ormoc', province: 'Leyte', region: 'Visayas' },
  { name: 'Tagbilaran', province: 'Bohol', region: 'Visayas' },
  { name: 'Roxas City', province: 'Capiz', region: 'Visayas' },
  { name: 'Kalibo', province: 'Aklan', region: 'Visayas' },
  // Mindanao
  { name: 'Davao City', province: 'Davao del Sur', region: 'Mindanao' },
  { name: 'Cagayan de Oro', province: 'Misamis Oriental', region: 'Mindanao' },
  { name: 'Zamboanga City', province: 'Zamboanga del Sur', region: 'Mindanao' },
  { name: 'General Santos', province: 'South Cotabato', region: 'Mindanao' },
  { name: 'Iligan', province: 'Lanao del Norte', region: 'Mindanao' },
  { name: 'Butuan', province: 'Agusan del Norte', region: 'Mindanao' },
  { name: 'Cotabato City', province: 'Maguindanao', region: 'Mindanao' },
  { name: 'Koronadal', province: 'South Cotabato', region: 'Mindanao' },
  { name: 'Tagum', province: 'Davao del Norte', region: 'Mindanao' },
  { name: 'Surigao City', province: 'Surigao del Norte', region: 'Mindanao' },
  { name: 'Dipolog', province: 'Zamboanga del Norte', region: 'Mindanao' },
  { name: 'Pagadian', province: 'Zamboanga del Sur', region: 'Mindanao' },
];

export const CITY_REGIONS: CityRegion[] = ['Luzon', 'Visayas', 'Mindanao'];
