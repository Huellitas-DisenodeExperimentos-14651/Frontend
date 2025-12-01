-- seeds/seed.sql
-- Sentencias INSERT para poblar la base de datos (adaptadas y coherentes)

-- INSERTS en users (upsert)
INSERT INTO users (id, username, email, password, role, name, address, paymentMethods, preferences, profilePic, bio, capacity, animalsAvailable, homeType, previousExperience, preferencesString, paymentMethodsString, paymentConfigured) VALUES
('1', 'admin', 'admin@example.com', 'admin123', 'admin', NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('2', 'usuario', 'usuario@example.com', 'usuario123', 'user', NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('98cd', 'christian', 'christian@gmail.com', 'Christian123', 'ADOPTER', 'Christian Renato', 'Av Alameda del Corregidor', '[]'::jsonb, '["Perros"]'::jsonb, 's', 'Mi nombre es Christian', 1, 0, 'Departamento', 'No cuento con experiencia previa', 'Perros', 'Yape', TRUE),
('ba8b', 'jose', 'jose@gmail.com', 'Jose123', 'SHELTER', 'Jose', 'Los Angamos 234', '["Yape"]'::jsonb, '["Perros"]'::jsonb, '' , 'Hola Soy Jose', 1, 0, 'Casa', 'Jose', NULL, NULL, NULL),
('7c70', 'refugiodsd', 'refugio@example.com', 'Hola123!', 'SHELTER', 'Refugio DSD', 'adsdas', '[]'::jsonb, '[]'::jsonb, '', 'dasddasdsa', 5, 2, NULL, NULL, NULL, NULL, TRUE),
('cc0e', 'hola', 'hola@gal.c', 'Hola123!', 'ADOPTER', 'asdads', 'dsadsa', '[]'::jsonb, '[]'::jsonb, 'https://unsplash.com/es/fotos/una-mujer-tomando-una-foto-de-la-puesta-de-sol-sobre-un-cuerpo-de-agua-a5LSIj59-4g', 'dsadas', 1, 0, 'dsdsa', 'asddas', NULL, NULL, TRUE),
('8e66', 'alvaro', 'alvaro@ejemplo.com', 'Alvaro123!!', 'SHELTER', 'Alvaro Alvaro', 'Alvaro', '[{"type":"OTRO","label":"OTRO • Alvaro","data":{"identifier":"Alvaro"}}]'::jsonb, '["Alvaro"]'::jsonb, 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', 'Alvaro', 4, 3, NULL, NULL, NULL, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  /* password intentionally left out to avoid overwriting existing hashed passwords */
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  paymentMethods = EXCLUDED.paymentMethods,
  preferences = EXCLUDED.preferences,
  profilePic = EXCLUDED.profilePic,
  bio = EXCLUDED.bio,
  capacity = EXCLUDED.capacity,
  animalsAvailable = EXCLUDED.animalsAvailable,
  homeType = EXCLUDED.homeType,
  previousExperience = EXCLUDED.previousExperience,
  preferencesString = EXCLUDED.preferencesString,
  paymentMethodsString = EXCLUDED.paymentMethodsString,
  paymentConfigured = EXCLUDED.paymentConfigured;

-- INSERTS en pets (upsert)
INSERT INTO pets (id, name, age, photo, breed, size, status, description, healthStatus, vaccinationStatus, specialNeeds, profileId) VALUES
('1', 'Max', 3, 'https://images.unsplash.com/photo-1561037404-61cd46aa615b', 'Labrador Retriever', 'large', 'adopted', 'Max es un perro juguetón y energético que adora los paseos largos y nadar en el lago.', 'Excelente', 'Completo', 'Necesita ejercicio diario', NULL),
('2', 'Luna', 2, 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', 'Siamés', 'small', 'available', 'Luna es una gata cariñosa pero tímida al principio. Le encanta dormir en lugares cálidos.', 'En tratamiento', 'Pendiente', 'Requiere dieta especial', NULL),
('3', 'Rocky', 5, 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee', 'Bulldog Francés', 'medium', 'available', 'Rocky es tranquilo y le encanta estar en compañía. Perfecto para departamentos pequeños.', 'Excelente', 'Completo', NULL, NULL),
('4d1', 'Bella', 1, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', 'Beagle', 'small', 'available', 'Bella es una cachorra juguetona y cariñosa, ideal para familias.', 'Buena', 'Parcial', 'Ninguno', 'ba8b'),
('5a2', 'Coco', 4, 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131', 'Poodle', 'small', 'available', 'Coco es muy inteligente y aprende rápido.', 'Excelente', 'Completo', 'Cepillado regular', '7c70'),
('6b3', 'Milo', 2, 'https://images.unsplash.com/photo-1507146426996-ef05306b995a', 'Mix', 'medium', 'available', 'Milo es activo y sociable.', 'Excelente', 'Completo', 'Ejercicio diario', '8e66'),
('7c4', 'Nala', 3, 'https://images.unsplash.com/photo-1507149833265-60c372daea22', 'Husky', 'large', 'interview', 'Nala es cariñosa y le encanta correr.', 'Buena', 'Completo', 'Corredora frecuente', '8e66'),
('8d5', 'Kira', 6, 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8', 'Bulldog', 'medium', 'available', 'Kira es calmada y muy dedicada a su familia.', 'Buena', 'Completo', NULL, NULL),
('9f1', 'Simba', 2, 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9', 'Mix', 'medium', 'available', 'Simba es juguetón y le encanta la interacción con niños.', 'Excelente', 'Completo', NULL, 'ba8b'),
('a2b', 'Mimi', 1, 'https://images.unsplash.com/photo-1543852786-1cf6624b9987', 'Shih Tzu', 'small', 'available', 'Mimi es cariñosa y le encanta dormir en brazos.', 'Buena', 'Parcial', NULL, '7c70'),
('b3c', 'Oso', 4, 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8', 'Golden Retriever', 'large', 'available', 'Oso es noble y muy paciente con niños.', 'Excelente', 'Completo', NULL, '8e66')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  photo = EXCLUDED.photo,
  breed = EXCLUDED.breed,
  size = EXCLUDED.size,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  healthStatus = EXCLUDED.healthStatus,
  vaccinationStatus = EXCLUDED.vaccinationStatus,
  specialNeeds = EXCLUDED.specialNeeds,
  profileId = EXCLUDED.profileId;

-- INSERTS en publications (upsert)
INSERT INTO publications (id, petId, title, description, photo, ownerId, publishedAt, isActive, contactInfo, location, petName) VALUES
('pub-101', '1', 'Max necesita una familia', 'Max es cariñoso y juguetón, busca un hogar con paciencia y mucho amor.', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b', 'ba8b', '2025-11-20T10:00:00.000Z'::timestamptz, TRUE, 'Jose - 999-111-222', 'Miraflores', 'Max'),
('pub-102', '2', 'Luna busca hogar tranquilo', 'Luna es una gata dulce, ideal para departamentos pequeños.', 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13', '7c70', '2025-11-22T15:30:00.000Z'::timestamptz, TRUE, 'Refugio DSD - refugio@example.com', 'San Isidro', 'Luna'),
('pub-103', '6b3', 'Milo, lleno de energía', 'Milo necesita una familia activa que lo saque a correr y juegue con él.', 'https://images.unsplash.com/photo-1507146426996-ef05306b995a', '8e66', '2025-11-25T09:45:00.000Z'::timestamptz, TRUE, 'Alvaro - alvaro@refugio.org', 'Sede', 'Milo'),
('pub-104', '7c4', 'Nala necesita espacio', 'Nala es una husky que necesita espacio y ejercicio diario.', 'https://images.unsplash.com/photo-1507149833265-60c372daea22', '8e66', '2025-11-26T11:20:00.000Z'::timestamptz, TRUE, 'Alvaro - 987-654-321', 'Sede', 'Nala'),
('pub-105', '9f1', 'Simba, perfecto con niños', 'Simba es muy paciente y juguetón; ideal para familias con niños.', 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9', 'ba8b', '2025-11-27T08:00:00.000Z'::timestamptz, TRUE, 'Jose - jose@refugio.org', 'Los Olivos', 'Simba'),
('pub-106', 'a2b', 'Mimi, la compañera perfecta', 'Mimi es una perrita pequeña muy tranquila que se adapta rápido.', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987', '7c70', '2025-11-28T14:10:00.000Z'::timestamptz, TRUE, 'Refugio DSD - contacto@refugio.org', 'Santiago de Surco', 'Mimi'),
('pub-107', 'b3c', 'Oso busca casa con jardín', 'Oso es un golden apacible que disfruta correr en jardines amplios.', 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8', '8e66', '2025-11-29T12:00:00.000Z'::timestamptz, TRUE, 'Alvaro - contacto@ejemplo.org', 'Sede', 'Oso')
ON CONFLICT (id) DO UPDATE SET
  petId = EXCLUDED.petId,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  photo = EXCLUDED.photo,
  ownerId = EXCLUDED.ownerId,
  publishedAt = EXCLUDED.publishedAt,
  isActive = EXCLUDED.isActive,
  contactInfo = EXCLUDED.contactInfo,
  location = EXCLUDED.location,
  petName = EXCLUDED.petName;

-- INSERTS en adoption_requests (upsert)
INSERT INTO adoption_requests (id, publicationId, petId, applicantId, applicantFullName, reasonMessage, status, requestDate, date, interviewDate, ownerId) VALUES
('4b6e', 'pub-101', '1', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'COMPLETED', '2025-11-14T23:28:31.278Z'::timestamptz, '2025-11-14T23:28:31.279Z'::timestamptz, NULL, NULL),
('1a43', 'pub-102', '2', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'REJECTED', '2025-11-15T23:08:22.272Z'::timestamptz, '2025-11-15T23:08:22.284Z'::timestamptz, NULL, NULL),
('0774', 'pub-103', '6b3', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'INTERVIEW', '2025-11-29T17:12:17.525Z'::timestamptz, NULL, '2025-12-05T21:30:00.000Z'::timestamptz, '8e66'),
('ffa7', 'pub-104', '7c4', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'INTERVIEW', '2025-11-29T17:12:46.274Z'::timestamptz, NULL, '2025-11-30T15:00:00.000Z'::timestamptz, '8e66'),
('480e', 'pub-104', '7c4', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'INTERVIEW', '2025-11-29T17:21:27.978Z'::timestamptz, NULL, '2025-11-30T15:00:00.000Z'::timestamptz, '8e66'),
('bdfd', NULL, '7c4', '98cd', 'Christian Renato', 'Quiero adoptar esta mascota.', 'PENDING', '2025-11-29T18:12:21.003Z'::timestamptz, NULL, NULL, '8e66')
ON CONFLICT (id) DO UPDATE SET
  publicationId = EXCLUDED.publicationId,
  petId = EXCLUDED.petId,
  applicantId = EXCLUDED.applicantId,
  applicantFullName = EXCLUDED.applicantFullName,
  reasonMessage = EXCLUDED.reasonMessage,
  status = EXCLUDED.status,
  requestDate = EXCLUDED.requestDate,
  date = EXCLUDED.date,
  interviewDate = EXCLUDED.interviewDate,
  ownerId = EXCLUDED.ownerId;

-- Fin de seed.sql
