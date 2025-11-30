const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'server', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const pets = db.pets || [];
const pubs = db.publications || [];
const pid = process.argv[2] || '8e66';
const ownedPetIds = new Set(pubs.filter(pub => pub && pub.ownerId !== undefined && pub.ownerId !== null && String(pub.ownerId) === pid).map(pub => String(pub.petId)));
const filtered = pets.filter(p => {
  if (!p) return false;
  if ((p.profileId !== undefined && p.profileId !== null && String(p.profileId) === pid) ||
      (p.ownerId !== undefined && p.ownerId !== null && String(p.ownerId) === pid)) return true;
  if (ownedPetIds.has(String(p.id))) return true;
  const candidates = [p.profileId, p.profileid, p.profile_id, p.ownerId, p.ownerid, p.owner_id, p.owner && (p.owner.id ?? p.owner.profileId), p.rescued_by, p.rescuedBy, p.rescueOwner];
  return candidates.some(c => c !== undefined && c !== null && String(c) === pid);
});
console.log('profileId:', pid);
console.log('ownedPetIds:', Array.from(ownedPetIds));
console.log('filtered count:', filtered.length);
console.log('filtered:', filtered.map(r => ({ id: r.id, name: r.name, profileId: r.profileId })));

