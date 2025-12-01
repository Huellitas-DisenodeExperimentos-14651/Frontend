// Netlify Function to mutate Neon (create/update/delete) using a simple JSONB table schema:
// Tables must have columns: id TEXT PRIMARY KEY, data JSONB
// Request (POST) JSON body: { action: 'create'|'update'|'delete', collection: 'pets', item: {...}, id: '123' }

const { Client } = require('pg');

const getDbUrl = () => process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

// sanitize identifier to valid postgres identifier
function sanitizeTable(name) {
  return name.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

// Common headers (CORS + JSON) - similar to query-neon.js
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async function(event, context) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: DEFAULT_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Method not allowed, use POST' }) };
  }

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    return { statusCode: 500, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Database URL not configured.' }) };
  }

  let body;
  try {
    // Si event.body ya es un objeto (algunas plataformas o middlewares lo hacen), úsalo directamente
    if (typeof event.body === 'object' && event.body !== null) {
      body = event.body;
    } else {
      let raw = event.body || '';
      // Si Netlify envía el body en base64 (serverless), decodificarlo
      if (event.isBase64Encoded) {
        try {
          raw = Buffer.from(raw, 'base64').toString('utf8');
        } catch (e) {
          console.log('mutate-neon: failed to base64-decode body', { isBase64Encoded: event.isBase64Encoded, rawLength: (event.body || '').length });
        }
      }
      // quitar BOM y trim
      try { raw = raw.replace(/^\uFEFF/, '').trim(); } catch (e) {}
      // Log breve del body para debugging (no imprimir datos sensibles completos)
      console.log('mutate-neon: raw body info', { len: raw ? raw.length : 0, isBase64Encoded: !!event.isBase64Encoded });
      // Intentar parsear
      try {
        body = JSON.parse(raw || '{}');
      } catch (e) {
        // Reintentar si el body viene doblemente stringified ("{\"a\":1}") -> eliminar comillas exteriores
        if (typeof raw === 'string' && raw.length > 1 && ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))) {
          const inner = raw.slice(1, -1).replace(/\\"/g, '"');
          body = JSON.parse(inner || '{}');
        } else {
          throw e;
        }
      }
    }
  } catch (err) {
    console.error('mutate-neon: invalid JSON body error', { err: err && err.message ? err.message : String(err), rawSample: (event.body || '').slice ? (event.body || '').slice(0, 200) : undefined, isBase64Encoded: !!event.isBase64Encoded });
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body', detail: { len: (event.body || '').length || 0, isBase64Encoded: !!event.isBase64Encoded } }) };
  }

  const { action, collection, item, id } = body;
  if (!action || !collection) {
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Missing action or collection' }) };
  }

  const table = sanitizeTable(collection);
  // whitelist collections (both raw and sanitized forms)
  const allowedRaw = ['pets','users','publications','adoption_requests','adoption-requests'];
  const allowedSanitized = allowedRaw.map(sanitizeTable);
  if (!allowedRaw.includes(collection) && !allowedSanitized.includes(table)) {
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Collection not allowed' }) };
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // Helper to prepare JSONB value (stringify objects)
    const prepareData = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') return v;
      try {
        return JSON.stringify(v);
      } catch (e) {
        // fallback to String
        return String(v);
      }
    };

    if (action === 'create') {
      if (!item || !item.id) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Item with id required for create' }) };
      const insertSql = `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
      const dataValue = prepareData(item);
      console.debug('mutate-neon: create', { table, sql: insertSql, params: [String(item.id), dataValue], itemPreview: { id: item.id, username: item.username, email: item.email } });
      console.log('mutate-neon: create', { table, sql: insertSql, params: [String(item.id), dataValue], itemPreview: { id: item.id, username: item.username, email: item.email } });
      try {
        await client.query(insertSql, [String(item.id), dataValue]);
      } catch (errInsert) {
        console.log('mutate-neon: create - insert into (id,data) failed, trying column fallback', { err: errInsert && errInsert.message ? errInsert.message : String(errInsert) });
        // If failure due to missing column `data` or undefined_column (Postgres 42703), try inserting into columns derived from item
        const fallbackErrMsg = (errInsert && errInsert.message) ? String(errInsert.message).toLowerCase() : '';
        if (fallbackErrMsg.includes('column "data" does not exist') || (errInsert && errInsert.code === '42703') || fallbackErrMsg.includes('column not found')) {
          // Try to add the `data` jsonb column and re-attempt the simple insert once
          try {
            console.log('mutate-neon: attempting to add data JSONB column to table', { table });
            await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS data JSONB`);
            console.log('mutate-neon: data column ensured, retrying insert into (id,data)');
            await client.query(insertSql, [String(item.id), dataValue]);
            return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: item.id, note: 'data column created and item inserted' }) };
          } catch (errAlter) {
            console.log('mutate-neon: creating data column or retry insert failed, will fallback to per-column insert', { err: errAlter && errAlter.message ? errAlter.message : String(errAlter) });
            // continue to per-column fallback
          }
           // Build dynamic columns from item (excluding id)
           const itemFields = Object.keys(item).filter(k => k !== 'id');
           if (itemFields.length === 0) throw errInsert;

          // Fetch actual columns and their data types for the table
          let tableCols = [];
          try {
            const colsRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
            tableCols = (colsRes && colsRes.rows) ? colsRes.rows : [];
            console.log('mutate-neon: table columns', { table, count: tableCols.length, sample: tableCols.slice(0,10) });
          } catch (e) {
            console.log('mutate-neon: failed to read table columns, will fallback to naive mapping', { err: e && e.message ? e.message : String(e) });
          }

          // Helper to find column data_type by sanitized name
          const toSnake = (s) => String(s).replace(/([A-Z])/g, '_$1').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().replace(/^_+/, '');
          const colTypeByName = {};
          for (const c of tableCols) {
            colTypeByName[String(c.column_name).toLowerCase()] = String(c.data_type).toLowerCase();
          }

          // Build lists using only columns that exist in the table (sanitized)
          const selected = itemFields.map(f => ({ orig: f, col: toSnake(f) })).filter(x => colTypeByName[x.col]);
          if (selected.length === 0) {
            // no mapped columns -> throw original insert error
            throw errInsert;
          }

          const cols = selected.map(s => s.col);
          const colList = ['id', ...cols].join(', ');
          // Build placeholders with explicit casting for json columns
          const placeholdersParts = cols.map((c, i) => {
            const idx = i + 2;
            const dtype = colTypeByName[c] || '';
            if (dtype.includes('json')) return `$${idx}::jsonb`;
            return `$${idx}`;
          });
          const placeholders = ['$1', ...placeholdersParts].join(', ');
           const values = [String(item.id)];
           // prepare values according to column type
           for (const s of selected) {
             const dtype = colTypeByName[s.col] || '';
             const v = item[s.orig];
             if (v === null || v === undefined) {
               values.push(null);
               continue;
             }
             // Normalize complex values to JSON text to avoid pg sending array literals
             const normalized = (typeof v === 'object') ? JSON.stringify(v) : v;
             if (dtype.includes('json')) {
               // For JSON/JSONB columns pass a JSON string (JSON.stringify) so Postgres parses it correctly
               values.push(normalized);
               continue;
             }
             if (dtype.includes('char') || dtype.includes('text')) {
               // for text columns stringify objects/arrays
               values.push(typeof v === 'object' ? normalized : String(v));
               continue;
             }
             if (dtype.includes('int') || dtype.includes('numeric') || dtype.includes('double') || dtype.includes('real') || dtype.includes('decimal')) {
               // try to convert to number
               const num = Number(v);
               values.push(isNaN(num) ? null : num);
               continue;
             }
             if (dtype.includes('bool')) {
               values.push(Boolean(v));
               continue;
             }
             // fallback: pass as string
             values.push(typeof v === 'object' ? normalized : String(v));
           }
           // Build ON CONFLICT update clause mapping each col to EXCLUDED.col
           const updateSet = cols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
           const dynSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`;
           console.log('mutate-neon: create fallback sql', { dynSql, valuesPreview: values.slice(0, 10) });
           await client.query(dynSql, values);
         } else {
           throw errInsert;
         }
       }
       return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: item.id }) };
     }

     if (action === 'update') {
       if (!item && !id) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'item or id required for update' }) };
       const uid = item && item.id ? String(item.id) : String(id);
       const updateSql = `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
       const dataValue = prepareData(item);
       console.debug('mutate-neon: update', { table, sql: updateSql, params: [uid, dataValue], uid, itemExists: !!item });
       console.log('mutate-neon: update', { table, sql: updateSql, params: [uid, dataValue], uid, itemExists: !!item });
       try {
         await client.query(updateSql, [uid, dataValue]);
       } catch (errUpdate) {
         console.log('mutate-neon: update - insert into (id,data) failed, trying column fallback', { err: errUpdate && errUpdate.message ? errUpdate.message : String(errUpdate) });
         const fallbackErrMsg = (errUpdate && errUpdate.message) ? String(errUpdate.message).toLowerCase() : '';
         if (fallbackErrMsg.includes('column "data" does not exist') || (errUpdate && errUpdate.code === '42703') || fallbackErrMsg.includes('column not found')) {
           // Try to add the `data` jsonb column and re-attempt the simple insert once
           try {
             console.log('mutate-neon: attempting to add data JSONB column to table (update)', { table });
             await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS data JSONB`);
             console.log('mutate-neon: data column ensured (update), retrying insert into (id,data)');
             await client.query(updateSql, [uid, dataValue]);
             return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: uid, note: 'data column created and item upserted' }) };
           } catch (errAlter) {
             console.log('mutate-neon: creating data column or retry insert failed (update), will fallback to per-column insert', { err: errAlter && errAlter.message ? errAlter.message : String(errAlter) });
             // continue to per-column fallback
           }
           // Use the same robust mapping as in CREATE fallback: detect table columns and map by type
           const itemFields = Object.keys(item).filter(k => k !== 'id');
           if (itemFields.length === 0) throw errUpdate;
           let tableCols = [];
           try {
             const colsRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
             tableCols = (colsRes && colsRes.rows) ? colsRes.rows : [];
             console.log('mutate-neon: table columns (update)', { table, count: tableCols.length, sample: tableCols.slice(0,10) });
           } catch (e) {
             console.log('mutate-neon: failed to read table columns (update), will fallback to naive mapping', { err: e && e.message ? e.message : String(e) });
           }
           const toSnake = (s) => String(s).replace(/([A-Z])/g, '_$1').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().replace(/^_+/, '');
           const colTypeByName = {};
           for (const c of tableCols) {
             colTypeByName[String(c.column_name).toLowerCase()] = String(c.data_type).toLowerCase();
           }
           const selected = itemFields.map(f => ({ orig: f, col: toSnake(f) })).filter(x => colTypeByName[x.col]);
           if (selected.length === 0) throw errUpdate;
           const cols = selected.map(s => s.col);
           const colList = ['id', ...cols].join(', ');
           // Build placeholders with explicit casting for json columns
           const placeholdersParts = cols.map((c, i) => {
             const idx = i + 2;
             const dtype = colTypeByName[c] || '';
             if (dtype.includes('json')) return `$${idx}::jsonb`;
             return `$${idx}`;
           });
           const placeholders = ['$1', ...placeholdersParts].join(', ');
           const values = [String(uid)];
           for (const s of selected) {
             const dtype = colTypeByName[s.col] || '';
             const v = item[s.orig];
             if (v === null || v === undefined) { values.push(null); continue; }
             // Normalize complex values to JSON text to avoid pg sending array literals
             const normalized = (typeof v === 'object') ? JSON.stringify(v) : v;
             if (dtype.includes('json')) { values.push(normalized); continue; }
             if (dtype.includes('char') || dtype.includes('text')) { values.push(typeof v === 'object' ? normalized : String(v)); continue; }
             if (dtype.includes('int') || dtype.includes('numeric') || dtype.includes('double') || dtype.includes('real') || dtype.includes('decimal')) { const num = Number(v); values.push(isNaN(num) ? null : num); continue; }
             if (dtype.includes('bool')) { values.push(Boolean(v)); continue; }
             values.push(typeof v === 'object' ? JSON.stringify(v) : String(v));
           }
           const updateSet = cols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
           const dynSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`;
           console.log('mutate-neon: update fallback sql', { dynSql, valuesPreview: values.slice(0, 10) });
           await client.query(dynSql, values);
         } else {
           throw errUpdate;
         }
       }
       return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: uid }) };
     }

     if (action === 'delete') {
       const uid = id ? String(id) : (item && item.id ? String(item.id) : null);
       if (!uid) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'id required for delete' }) };
       const delSql = `DELETE FROM ${table} WHERE id = $1`;
       console.debug('mutate-neon: delete', { table, sql: delSql, params: [uid], uid });
       console.log('mutate-neon: delete', { table, sql: delSql, params: [uid], uid });
       await client.query(delSql, [uid]);
       return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: uid }) };
     }

     return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Unknown action' }) };
   } catch (err) {
     console.error('mutate-neon error', err);
     return { statusCode: 500, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: err && err.message ? err.message : String(err) }) };
   } finally {
     try { await client.end(); } catch (e) {}
   }
};
