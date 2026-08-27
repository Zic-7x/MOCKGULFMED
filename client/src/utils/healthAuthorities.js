/**
 * Normalizes a health authority object into a canonical key.
 * This groups together acronyms and full names (e.g. "SCFHS (Saudi Arabia)" and "Saudi Commission for Health Specialties").
 */
export function getHealthAuthorityCanonicalKey(ha) {
  if (!ha) return '';
  const name = String(ha.name || '').trim().toLowerCase();
  const country = String(ha.country || '').trim().toLowerCase();

  // Saudi Arabia: SCFHS
  if (
    name.includes('scfhs') ||
    name.includes('saudi commission') ||
    name.includes('saudi council')
  ) {
    return 'scfhs';
  }

  // Dubai: DHA
  if (name.includes('dha') || name.includes('dubai health authority')) {
    return 'dha';
  }

  // UAE: MoHAP
  if (
    name.includes('mohap') ||
    name.includes('ministry of health and prevention') ||
    (name.includes('ministry of health') && (country.includes('emirates') || country.includes('uae') || name.includes('uae')))
  ) {
    return 'mohap';
  }

  // Abu Dhabi: DOH / HAAD
  if (
    name.includes('haad') ||
    name.includes('abu dhabi') ||
    (name.startsWith('doh') && (country.includes('emirates') || country.includes('uae') || name.includes('abu dhabi')))
  ) {
    return 'doh';
  }

  // Qatar: QCHP / DHP / MOPH
  if (
    name.includes('qchp') ||
    name.includes('dhp') ||
    name.includes('qatar council') ||
    name.includes('healthcare practitioners') ||
    name.includes('healthcare professions') ||
    (name.includes('moph') && country.includes('qatar'))
  ) {
    return 'qchp';
  }

  // Oman: OMSB
  if (name.includes('omsb') || name.includes('oman medical')) {
    return 'omsb';
  }

  // Bahrain: NHRA
  if (
    name.includes('nhra') ||
    name.includes('national health regulatory') ||
    (name.includes('bahrain') && name.includes('health'))
  ) {
    return 'nhra';
  }

  // Kuwait: MOH
  if (
    name.includes('kuwait') ||
    (name.includes('moh') && (country.includes('kuwait') || name.includes('kuwait')))
  ) {
    return 'moh_kuwait';
  }

  // Fallback: sanitized alphanumeric name + country
  const cleanName = name.replace(/[^a-z0-9]/g, '');
  const cleanCountry = country.replace(/[^a-z0-9]/g, '');
  return cleanName ? `${cleanName}_${cleanCountry}` : `id_${ha.id || ''}`;
}

/**
 * Deduplicates a list of health authorities by exact ID, canonical key, and normalized name.
 * Prefers standard formatted names (e.g. "SCFHS (Saudi Arabia)" over "Saudi Commission for Health Specialties").
 */
export function deduplicateHealthAuthorities(list) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const map = new Map();
  const seenIds = new Set();

  for (const item of list) {
    if (!item) continue;
    const id = item.id != null ? String(item.id) : '';
    if (id && seenIds.has(id)) {
      continue; // Skip exact duplicate IDs
    }

    const key = getHealthAuthorityCanonicalKey(item);
    if (!key) {
      if (id) seenIds.add(id);
      map.set(id || `rand_${Math.random()}`, item);
      continue;
    }

    if (!map.has(key)) {
      if (id) seenIds.add(id);
      map.set(key, { ...item, _alternateIds: [] });
    } else {
      const existing = map.get(key);
      const existingHasParen = /\([^)]+\)/.test(existing.name || '');
      const itemHasParen = /\([^)]+\)/.test(item.name || '');

      const combinedAlts = [
        ...(existing._alternateIds || []),
        ...(item._alternateIds || []),
        id,
      ].filter(Boolean);

      if (!existingHasParen && itemHasParen) {
        // Swap to the preferred shorter/standard acronym + jurisdiction format
        if (id) seenIds.add(id);
        map.set(key, {
          ...item,
          _alternateIds: [existing.id, ...combinedAlts].filter((x) => x && x !== item.id),
        });
      } else {
        existing._alternateIds = combinedAlts.filter((x) => x && x !== existing.id);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates a list of professions by trimmed lowercase name.
 */
export function deduplicateProfessions(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const map = new Map();
  const seenIds = new Set();

  for (const item of list) {
    if (!item) continue;
    const id = item.id != null ? String(item.id) : '';
    if (id && seenIds.has(id)) continue;

    const nameKey = String(item.name || '').trim().toLowerCase();
    if (!nameKey) continue;

    if (!map.has(nameKey)) {
      if (id) seenIds.add(id);
      map.set(nameKey, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates a list of packages by ID or name.
 */
export function deduplicatePackages(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const map = new Map();
  const seenIds = new Set();

  for (const item of list) {
    if (!item) continue;
    const id = item.id != null ? String(item.id) : '';
    if (id && seenIds.has(id)) continue;

    const key = id || String(item.name || '').trim().toLowerCase();
    if (!key) continue;

    if (!map.has(key)) {
      if (id) seenIds.add(id);
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Cleanly formats the health authority label without redundant country duplicates.
 * E.g. "SCFHS (Saudi Arabia)" is returned as "SCFHS (Saudi Arabia)" instead of "SCFHS (Saudi Arabia) (Saudi Arabia)".
 */
export function formatHealthAuthorityLabel(ha) {
  if (!ha) return '';
  const name = String(ha.name || '').trim();
  const country = String(ha.country || '').trim();

  if (!name) return country;
  if (!country) return name;

  // If the name already ends with a parenthetical tag e.g. "SCFHS (Saudi Arabia)", "DHA (Dubai)", "MoHAP (UAE)"
  if (/\([^)]+\)$/.test(name)) {
    return name;
  }

  // If the country is already in the name string
  if (name.toLowerCase().includes(country.toLowerCase())) {
    return name;
  }

  return `${name} (${country})`;
}
