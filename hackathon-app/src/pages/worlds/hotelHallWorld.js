export const hotelHallWorld = {
  id: 'hotel-hall',
  label: 'Hotel Hall',
  modelPath: '/assets/models/hotel_hall.glb',
  beaconVariant: 'crystal',
  exhibits: [
    {
      id: 'memory-cube',
      label: 'Memory Cube',
      intro: 'A quiet cube that holds fragments of memory, gathered from every step through the hall.',
      storyTitle: 'The Story',
      story:
        'Voices linger here, gathered into a small geometric archive. The cube keeps the details that are easy to forget and turns them into something present again, like a record of people who passed through with hope, worry, and unfinished thoughts.',
      messageTitle: 'The Message',
      message:
        'What feels ordinary can still carry meaning. Memory is not only what remains, but what we choose to keep close enough to matter.',
      position: [-2.36, 1.95, 1.05],
      color: '#00f5ff',
      nodeId: 'hall-2',
    },
    {
      id: 'signal-orb',
      label: 'Signal Orb',
      intro: 'A luminous orb that tracks the paths, pauses, and returns that shape a life.',
      storyTitle: 'The Story',
      story:
        'Every step creates a ripple. The orb was made to remember presence, tracing the invisible paths we leave behind when we care for someone, return to them, and keep showing up even when the work is unseen.',
      messageTitle: 'The Message',
      message: 'Small repeated acts become a form of devotion. Care does not need to be dramatic to be real.',
      position: [-4.74, 1.95, 1.2],
      color: '#8dff6f',
      nodeId: 'left-gallery',
    },
    {
      id: 'echo-prism',
      label: 'Echo Prism',
      intro: 'A prism that bends time into light, shadow, and layered remembrance.',
      storyTitle: 'The Story',
      story:
        'Time bends through this glass. Yesterday\'s light meets tomorrow\'s shadow, and the prism turns that collision into a clear image of how people remember, revise, and keep each other alive in stories.',
      messageTitle: 'The Message',
      message: 'The past does not disappear. It changes shape and continues to guide what we notice next.',
      position: [-0.62, 1.95, -0.45],
      color: '#ffad66',
      nodeId: 'right-gallery',
    },
    {
      id: 'time-gate',
      label: 'Time Gate',
      intro: 'A threshold suspended between what has happened and what may still arrive.',
      storyTitle: 'The Story',
      story:
        'What could have been. What might still be. The gate stands at the edge of becoming, inviting the visitor to imagine futures that are not fixed yet and to stay open to what can still change.',
      messageTitle: 'The Message',
      message: 'The future is not a promise, but it is not closed either. Hope lives in that open space.',
      position: [-3.72, 1.95, -1.82],
      color: '#ff70a6',
      nodeId: 'hall-end',
    },
  ],
}
