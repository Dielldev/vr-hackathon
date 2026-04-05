export const EXHIBIT_TRANSFORM_STORAGE_KEY = 'resilient.exhibitTransforms.v1'

function readStorage() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(EXHIBIT_TRANSFORM_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStorage(allTransforms) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(EXHIBIT_TRANSFORM_STORAGE_KEY, JSON.stringify(allTransforms))
}

function normalizePosition(position) {
  if (!Array.isArray(position) || position.length < 3) {
    return null
  }

  const x = Number(position[0])
  const y = Number(position[1])
  const z = Number(position[2])

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return null
  }

  return [x, y, z]
}

export function getWorldExhibitTransforms(worldId) {
  const all = readStorage()
  const worldTransforms = all?.[worldId]

  if (!worldTransforms || typeof worldTransforms !== 'object') {
    return {}
  }

  return worldTransforms
}

export function mergeExhibitsWithTransforms(worldId, baseExhibits) {
  if (!Array.isArray(baseExhibits)) {
    return []
  }

  const worldTransforms = getWorldExhibitTransforms(worldId)
  const merged = []

  for (const exhibit of baseExhibits) {
    const override = worldTransforms?.[exhibit.id]
    const overridePosition = normalizePosition(override?.position)

    if (overridePosition) {
      merged.push({
        ...exhibit,
        position: overridePosition,
      })
      continue
    }

    merged.push({ ...exhibit })
  }

  return merged
}

export function updateWorldExhibitTransforms(worldId, exhibits) {
  const all = readStorage()
  const nextWorld = {}

  if (Array.isArray(exhibits)) {
    for (const exhibit of exhibits) {
      const normalized = normalizePosition(exhibit?.position)
      if (!normalized || !exhibit?.id) {
        continue
      }

      nextWorld[exhibit.id] = {
        position: normalized,
      }
    }
  }

  all[worldId] = nextWorld
  writeStorage(all)

  return nextWorld
}

export function resetWorldExhibitTransforms(worldId) {
  const all = readStorage()
  if (all[worldId]) {
    delete all[worldId]
  }
  writeStorage(all)
}
