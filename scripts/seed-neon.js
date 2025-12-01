/*
  scripts/seed-neon.js
  Seeder that posts records to the Netlify Function `mutate-neon`.

  Usage (from project root):
    node scripts\seed-neon.js

  By default it targets local Netlify dev at http://localhost:8888/.netlify/functions/mutate-neon
  To target a deployed site set MUTATE_ENDPOINT, e.g.:
    set MUTATE_ENDPOINT=https://your-site.netlify.app/.netlify/functions/mutate-neon

  NOTE: This script tries to use global fetch (Node 18+). If your Node doesn't provide fetch,
  run `npm install node-fetch` and set NODE_FETCH=1 to force using it.
*/

const DEFAULT_ENDPOINT = process.env.MUTATE_ENDPOINT || 'http://localhost:8888/.netlify/functions/mutate-neon';
const endpoint = DEFAULT_ENDPOINT;

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  try {
    // try node-fetch (v2/v3 compatible require)
    // eslint-disable-next-line global-require
    const nf = require('node-fetch');
    return nf;
  } catch (e) {
    throw new Error('Global fetch not available. Install node-fetch: npm install node-fetch');
  }
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --- Data (cleaned / slightly adjusted for consistency) ---
const pets = [
  { id: '1', name: 'Max', age: 3, photo: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b', breed: 'Labrador Retriever', size: 'large', status: 'adopted', description: 'Max es un perro juguetón y energético que adora los paseos largos y nadar en el lago.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: 'Necesita ejercicio diario', profileId: null },
  { id: '2', name: 'Luna', age: 2, photo: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', breed: 'Siamés', size: 'small', status: 'available', description: 'Luna es una gata cariñosa pero tímida al principio. Le encanta dormir en lugares cálidos.', healthStatus: 'En tratamiento', vaccinationStatus: 'Pendiente', specialNeeds: 'Requiere dieta especial', profileId: null },
  { id: '3', name: 'Rocky', age: 5, photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee', breed: 'Bulldog Francés', size: 'medium', status: 'available', description: 'Rocky es tranquilo y le encanta estar en compañía. Perfecto para departamentos pequeños.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: null, profileId: null },
  { id: '4d1', name: 'Bella', age: 1, photo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', breed: 'Beagle', size: 'small', status: 'available', description: 'Bella es una cachorra juguetona y cariñosa, ideal para familias.', healthStatus: 'Buena', vaccinationStatus: 'Parcial', specialNeeds: 'Ninguno', profileId: 'ba8b' },
  { id: '5a2', name: 'Coco', age: 4, photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131', breed: 'Poodle', size: 'small', status: 'available', description: 'Coco es muy inteligente y aprende rápido.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: 'Cepillado regular', profileId: '7c70' },
  { id: '6b3', name: 'Milo', age: 2, photo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a', breed: 'Mix', size: 'medium', status: 'available', description: 'Milo es activo y sociable.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: 'Ejercicio diario', profileId: '8e66' },
  { id: '7c4', name: 'Nala', age: 3, photo: 'https://images.unsplash.com/photo-1507149833265-60c372daea22', breed: 'Husky', size: 'large', status: 'interview', description: 'Nala es cariñosa y le encanta correr.', healthStatus: 'Buena', vaccinationStatus: 'Completo', specialNeeds: 'Corredora frecuente', profileId: '8e66' },
  { id: '8d5', name: 'Kira', age: 6, photo: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8', breed: 'Bulldog', size: 'medium', status: 'available', description: 'Kira es calmada y muy dedicada a su familia.', healthStatus: 'Buena', vaccinationStatus: 'Completo', specialNeeds: null, profileId: null },
  { id: '9f1', name: 'Simba', age: 2, photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9', breed: 'Mix', size: 'medium', status: 'available', description: 'Simba es juguetón y le encanta la interacción con niños.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: null, profileId: 'ba8b' },
  { id: 'a2b', name: 'Mimi', age: 1, photo: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987', breed: 'Shih Tzu', size: 'small', status: 'available', description: 'Mimi es cariñosa y le encanta dormir en brazos.', healthStatus: 'Buena', vaccinationStatus: 'Parcial', specialNeeds: null, profileId: '7c70' },
  { id: 'b3c', name: 'Oso', age: 4, photo: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8', breed: 'Golden Retriever', size: 'large', status: 'available', description: 'Oso es noble y muy paciente con niños.', healthStatus: 'Excelente', vaccinationStatus: 'Completo', specialNeeds: null, profileId: '8e66' }
];

const users = [
  { id: '1', username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { id: '2', username: 'usuario', email: 'usuario@example.com', password: 'usuario123', role: 'user' },
  { id: '98cd', username: 'Christian', email: 'Christian@gmail.com', password: 'Christian123', role: 'ADOPTER', name: 'Christian Renato', address: 'Av Alameda del Corregidor', paymentMethods: [], preferences: ['Perros'], profilePic: 's', bio: 'Mi nombre es Christian', capacity: 1, animalsAvailable: 0, homeType: 'Departamento', previousExperience: 'No cuento con experiencia previa', preferencesString: 'Perros', paymentMethodsString: 'Yape', paymentConfigured: true },
  { id: 'ba8b', username: 'Jose', email: 'Jose@gmail.com', password: 'Jose123', role: 'SHELTER', name: 'Jose', address: 'Los Angamos 234', paymentMethods: ['Yape'], preferences: ['Perros'], profilePic: '', bio: 'Hola Soy Jose', capacity: 1, animalsAvailable: 0, homeType: 'Casa', previousExperience: 'Jose', paymentMethodsString: null, paymentConfigured: null },
  { id: '7c70', username: 'refugiodsd', email: 'refugio@example.com', password: 'Hola123!', role: 'SHELTER', name: 'Refugio DSD', address: 'adsdas', paymentMethods: [], preferences: [], profilePic: '', bio: 'dasddasdsa', capacity: 5, animalsAvailable: 2 },
  { id: 'cc0e', username: 'Hola', email: 'hola@gal.c', password: 'Hola123!', role: 'ADOPTER', name: 'asdads', address: 'dsadsa', paymentMethods: [], preferences: [], profilePic: 'https://unsplash.com/es/fotos/una-mujer-tomando-una-foto-de-la-puesta-de-sol-sobre-un-cuerpo-de-agua-a5LSIj59-4g', bio: 'dsadas', capacity: 1, animalsAvailable: 0, homeType: 'dsdsa', previousExperience: 'asddas', paymentConfigured: true },
  { id: '8e66', username: 'Alvaro', email: 'Alvaro@Alvaro', password: 'Alvaro123!!', role: 'SHELTER', name: 'Alvaro Alvaro', address: 'Alvaro', paymentMethods: [{ type: 'OTRO', label: 'OTRO • Alvaro', data: { identifier: 'Alvaro' } }], preferences: ['Alvaro'], profilePic: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', bio: 'Alvaro', capacity: 4, animalsAvailable: 3, paymentConfigured: true }
];

const publications = [
  { id: 'pub-101', petId: '1', title: 'Max necesita una familia', description: 'Max es cariñoso y juguetón, busca un hogar con paciencia y mucho amor.', photo: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b', ownerId: 'ba8b', publishedAt: '2025-11-20T10:00:00.000Z', isActive: true, contactInfo: 'Jose - 999-111-222', location: 'Miraflores', petName: 'Max' },
  { id: 'pub-102', petId: '2', title: 'Luna busca hogar tranquilo', description: 'Luna es una gata dulce, ideal para departamentos pequeños.', photo: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', ownerId: '7c70', publishedAt: '2025-11-22T15:30:00.000Z', isActive: true, contactInfo: 'Refugio DSD - refugio@example.com', location: 'San Isidro', petName: 'Luna' },
  { id: 'pub-103', petId: '6b3', title: 'Milo, lleno de energía', description: 'Milo necesita una familia activa que lo saque a correr y juegue con él.', photo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a', ownerId: '8e66', publishedAt: '2025-11-25T09:45:00.000Z', isActive: true, contactInfo: 'Alvaro - alvaro@refugio.org', location: 'Sede', petName: 'Milo' },
  { id: 'pub-104', petId: '7c4', title: 'Nala necesita espacio', description: 'Nala es una husky que necesita espacio y ejercicio diario.', photo: 'https://images.unsplash.com/photo-1507149833265-60c372daea22', ownerId: '8e66', publishedAt: '2025-11-26T11:20:00.000Z', isActive: true, contactInfo: 'Alvaro - 987-654-321', location: 'Sede', petName: 'Nala' },
  { id: 'pub-105', petId: '9f1', title: 'Simba, perfecto con niños', description: 'Simba es muy paciente y juguetón; ideal para familias con niños.', photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9', ownerId: 'ba8b', publishedAt: '2025-11-27T08:00:00.000Z', isActive: true, contactInfo: 'Jose - jose@refugio.org', location: 'Los Olivos', petName: 'Simba' },
  { id: 'pub-106', petId: 'a2b', title: 'Mimi, la compañera perfecta', description: 'Mimi es una perrita pequeña muy tranquila que se adapta rápido.', photo: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987', ownerId: '7c70', publishedAt: '2025-11-28T14:10:00.000Z', isActive: true, contactInfo: 'Refugio DSD - contacto@refugio.org', location: 'Santiago de Surco', petName: 'Mimi' },
  { id: 'pub-107', petId: 'b3c', title: 'Oso busca casa con jardín', description: 'Oso es un golden apacible que disfruta correr en jardines amplios.', photo: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8', ownerId: '8e66', publishedAt: '2025-11-29T12:00:00.000Z', isActive: true, contactInfo: 'Alvaro - contacto@ejemplo.org', location: 'Sede', petName: 'Oso' }
];

const adoptionRequests = [
  { id: '4b6e', publicationId: 'pub-101', petId: '1', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'COMPLETED', requestDate: '2025-11-14T23:28:31.278Z', date: '2025-11-14T23:28:31.279Z', interviewDate: null, ownerId: null },
  { id: '1a43', publicationId: 'pub-102', petId: '2', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'REJECTED', requestDate: '2025-11-15T23:08:22.272Z', date: '2025-11-15T23:08:22.284Z', interviewDate: null, ownerId: null },
  { id: '0774', publicationId: 'pub-103', petId: '6b3', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'INTERVIEW', requestDate: '2025-11-29T17:12:17.525Z', date: null, interviewDate: '2025-12-05T21:30:00.000Z', ownerId: '8e66' },
  { id: 'ffa7', publicationId: 'pub-104', petId: '7c4', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'INTERVIEW', requestDate: '2025-11-29T17:12:46.274Z', date: null, interviewDate: '2025-11-30T15:00:00.000Z', ownerId: '8e66' },
  { id: '480e', publicationId: 'pub-104', petId: '7c4', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'INTERVIEW', requestDate: '2025-11-29T17:21:27.978Z', date: null, interviewDate: '2025-11-30T15:00:00.000Z', ownerId: '8e66' },
  { id: 'bdfd', publicationId: null, petId: '7c4', applicantId: '98cd', applicantFullName: 'Christian Renato', reasonMessage: 'Quiero adoptar esta mascota.', status: 'PENDING', requestDate: '2025-11-29T18:12:21.003Z', date: null, interviewDate: null, ownerId: '8e66' }
];

async function postItem(fetchFn, collection, item) {
  const body = { action: 'create', collection, item };
  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
  return { status: res.status, body: json };
}

async function run() {
  console.log('Seeder endpoint:', endpoint);
  const fetchFn = await getFetch();

  const batches = [
    { collection: 'users', items: users },
    { collection: 'pets', items: pets },
    { collection: 'publications', items: publications },
    { collection: 'adoption_requests', items: adoptionRequests }
  ];

  for (const batch of batches) {
    console.log(`\nSeeding collection: ${batch.collection} (${batch.items.length} items)`);
    for (const item of batch.items) {
      try {
        const result = await postItem(fetchFn, batch.collection, item);
        console.log('->', batch.collection, item.id, '=>', result.status, JSON.stringify(result.body));
      } catch (err) {
        console.error('ERROR posting', batch.collection, item.id, err && err.message ? err.message : String(err));
      }
      // short delay to avoid hammering server
      await delay(120);
    }
  }
  console.log('\nSeeding finished.');
}

run().catch((err) => { console.error('Seeder failed', err); process.exit(1); });

