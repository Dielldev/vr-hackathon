export const WORLD_TRANSFORM_STORAGE_KEY = 'resilient.worldTransforms.v1'

export const WORLD_TRANSFORM_DEFAULTS = {
  'hotel-hall': {
    scale: 1,
    posX: 0,
    posY: 0,
    posZ: 0,
    rotationYDeg: 0,
  },
  'hotel-hall-prototype': {
    targetSize: 28,
    offsetX: -2.4,
    offsetY: 1.2,
    offsetZ: 0.8,
    rotationYDeg: 180,
    groundY: 0,
  },
  'art-gallery': {
    scale: 1,
    posX: 0,
    posY: 0,
    posZ: 0,
    rotationYDeg: 0,
  },
}

function cloneDefaults() {
  return JSON.parse(JSON.stringify(WORLD_TRANSFORM_DEFAULTS))
}

export function getAllWorldTransforms() {
  const defaults = cloneDefaults()

  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const raw = window.localStorage.getItem(WORLD_TRANSFORM_STORAGE_KEY)
    if (!raw) {
      return defaults
    }

    const parsed = JSON.parse(raw)
    const merged = {}

    for (const worldId of Object.keys(defaults)) {
      merged[worldId] = {
        ...defaults[worldId],
        ...(parsed?.[worldId] || {}),
      }
    }

    return merged
  } catch {
    return defaults
  }
}

export function getWorldTransform(worldId) {
  const all = getAllWorldTransforms()
  return all[worldId] || cloneDefaults()['hotel-hall']
}

function saveAllWorldTransforms(allTransforms) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    WORLD_TRANSFORM_STORAGE_KEY,
    JSON.stringify(allTransforms),
  )
}

export function updateWorldTransform(worldId, nextTransform) {
  const all = getAllWorldTransforms()
  all[worldId] = {
    ...(all[worldId] || {}),
    ...nextTransform,
  }

  saveAllWorldTransforms(all)
  return all[worldId]
}

export function resetWorldTransform(worldId) {
  const defaults = cloneDefaults()
  const all = getAllWorldTransforms()
  all[worldId] = {
    ...(defaults[worldId] || {}),
  }

  saveAllWorldTransforms(all)
  return all[worldId]
}
