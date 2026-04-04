import { hotelHallWorld } from './hotelHallWorld'
import { hotelHallPrototypeWorld } from './hotelHallPrototypeWorld'
import { artGalleryWorld } from './artGalleryWorld'

export const DEFAULT_WORLD_ID = 'hotel-hall'

export const WORLD_REGISTRY = {
  [hotelHallWorld.id]: hotelHallWorld,
  [hotelHallPrototypeWorld.id]: hotelHallPrototypeWorld,
  [artGalleryWorld.id]: artGalleryWorld,
}
