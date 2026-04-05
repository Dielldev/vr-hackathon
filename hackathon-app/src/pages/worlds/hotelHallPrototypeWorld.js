export const hotelHallPrototypeWorld = {
  id: 'hotel-hall-prototype',
  label: 'Hotel Hall Test',
  modelPath: '/assets/models/dae_diorama_-_grandmas_house.glb',
  beaconVariant: 'ring',
  exhibits: [

    {
      id: 'proto-wave',
      label: 'Wave Relay',
      intro: 'Gheorghe Zolotco, patient, Moldova. 83, retired kolkhoz director.',
      storyTitle: 'A Manuscript of Life',
      story:
        'In Ohrincea, Gheorghe Zolotco spent a lifetime serving his community through agriculture, history, and literature. After surviving his third angina attack, he returned to writing a handwritten manuscript about village life, encouraged by his wife to preserve memory for future generations. After her passing, the manuscript became both a grief companion and a daily source of strength. He says hardship can become opportunity when people choose dignity and service.',
      messageTitle: 'The Message',
      message: 'Loss and illness did not defeat me; they taught me to stay dignified and serve others.',
      position: [3.27, -2.26, 3.69],
      color: '#ffe066',
      nodeId: 'left-gallery',
    },
    {
      id: 'proto-gate',
      label: 'Gate Maker',
      intro: 'Nadiia, patient, Ukraine. 37, endocrinologist.',
      storyTitle: 'A Battle on Two Fronts',
      story:
        'Nadiia has lived with diabetes since childhood and later became an endocrinologist helping others. War displaced her from Luhansk in 2014 and again in 2022, where shelling and stress pushed her blood sugar beyond control even with insulin. She carries diabetes essentials and a whistle in case she is trapped during attacks. Despite shortages and outages, she continues sharing insulin and supporting patients around her.',
      messageTitle: 'The Message',
      message: 'I fight every day: for my life, and for the lives of others.',
      position: [8.12, -2.99, 4.36],
      color: '#ff6f91',
      nodeId: 'hall-end',
    },
  ],
}
