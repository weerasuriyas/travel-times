// Destinations database
export const destinations = {
  'kandy': {
    slug: 'kandy',
    name: 'Kandy',
    tagline: 'The Cultural Capital',
    description: 'Nestled in the hills of central Sri Lanka, Kandy is home to the sacred Temple of the Tooth and the spectacular Esala Perahera festival.',
    heroImage: 'https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80',
    coordinates: [7.2906, 80.6337],
    region: 'Central Province',
    highlights: [
      'Temple of the Tooth Relic',
      'Esala Perahera Festival',
      'Royal Botanical Gardens',
      'Kandy Lake'
    ],
    stats: {
      elevation: '500m',
      temperature: '24°C',
      bestTime: 'July - August'
    },

    // Events happening in Kandy
    events: [
      {
        name: 'The Fire of Kandy',
        slug: 'kandy-perahera',
        type: 'Cultural Festival',
        month: 'July - August',
        duration: '10 nights',
        image: '/perahera_banner.jpg',
        description: 'The Esala Perahera draws more than a million pilgrims and tourists annually to witness this spectacular Buddhist festival.',
        featured: true
      },
      {
        name: 'Kandy Cultural Show',
        type: 'Daily Performance',
        month: 'Year-round',
        duration: '1 hour',
        image: 'https://images.unsplash.com/photo-1599874811937-be93d8dd9fac?auto=format&fit=crop&q=80',
        description: 'Traditional Kandyan dancing, fire walking, and drumming performances every evening.'
      }
    ],

    // Things to do in Kandy
    thingsToDo: [
      {
        name: 'Visit Temple of the Tooth',
        category: 'Culture',
        duration: '2-3 hours',
        image: 'https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80',
        description: 'Sacred Buddhist temple housing a tooth relic of the Buddha.',
        price: 'Rs. 2000'
      },
      {
        name: 'Explore Royal Botanical Gardens',
        category: 'Nature',
        duration: '2-4 hours',
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80',
        description: 'Sprawling gardens featuring over 4,000 species of plants, including orchids and giant bamboo.',
        price: 'Rs. 1500'
      },
      {
        name: 'Walk Around Kandy Lake',
        category: 'Leisure',
        duration: '1 hour',
        image: 'https://images.unsplash.com/photo-1599874811937-be93d8dd9fac?auto=format&fit=crop&q=80',
        description: 'Scenic walk around the artificial lake in the heart of the city.',
        price: 'Free'
      },
      {
        name: 'Bahirawakanda Temple',
        category: 'Viewpoint',
        duration: '1 hour',
        image: 'https://images.unsplash.com/photo-1552799446-159ba9523315?auto=format&fit=crop&q=80',
        description: 'Giant Buddha statue with panoramic views of Kandy city.',
        price: 'Free'
      }
    ]
  },

  'ella': {
    slug: 'ella',
    name: 'Ella',
    tagline: 'Hill Country Paradise',
    description: 'A charming village surrounded by tea plantations, offering breathtaking views, hiking trails, and the famous train journey.',
    heroImage: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
    coordinates: [6.8667, 81.0456],
    region: 'Uva Province',
    highlights: [
      'Nine Arch Bridge',
      'Ella Rock Hike',
      'Little Adam\'s Peak',
      'Ravana Falls'
    ],
    stats: {
      elevation: '1,041m',
      temperature: '18°C',
      bestTime: 'December - March'
    },

    events: [
      {
        name: 'Ella to Kandy: The Slowest Express',
        slug: 'ella-to-kandy',
        type: 'Scenic Journey',
        month: 'Year-round',
        duration: '9 hours',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        description: 'One of the world\'s most beautiful train journeys through tea country.',
        featured: true
      }
    ],

    thingsToDo: [
      {
        name: 'Hike to Ella Rock',
        category: 'Adventure',
        duration: '4-5 hours',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80',
        description: 'Challenging hike with spectacular views of the Ella Gap and surrounding valleys.',
        price: 'Free'
      },
      {
        name: 'Visit Nine Arch Bridge',
        category: 'Photography',
        duration: '1-2 hours',
        image: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
        description: 'Iconic colonial-era bridge spanning a jungle valley, perfect for train spotting.',
        price: 'Free'
      },
      {
        name: 'Little Adam\'s Peak Trek',
        category: 'Hiking',
        duration: '1-2 hours',
        image: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
        description: 'Easy scenic hike with 360-degree views of tea plantations.',
        price: 'Free'
      }
    ]
  },

  'haputale': {
    slug: 'haputale',
    name: 'Haputale',
    tagline: 'Tea Estate Heaven',
    description: 'A sleepy hill town perched on the edge of a mountain, offering stunning views and access to historic tea estates.',
    heroImage: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
    coordinates: [6.7833, 80.9667],
    region: 'Uva Province',
    highlights: [
      'Dambatenne Tea Factory',
      'Lipton\'s Seat',
      'Adisham Bungalow',
      'Tea Estate Trails'
    ],
    stats: {
      elevation: '1,431m',
      temperature: '16°C',
      bestTime: 'March - September'
    },

    events: [
      {
        name: 'Dambatenne: Lipton\'s Lost Trail',
        slug: 'dambatenne-liptons-trail',
        type: 'Heritage Trail',
        month: 'Year-round',
        duration: 'Full day',
        image: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
        description: 'Explore Sir Thomas Lipton\'s tea empire at the historic Dambatenne factory.',
        featured: true
      }
    ],

    thingsToDo: [
      {
        name: 'Dambatenne Tea Factory Tour',
        category: 'Heritage',
        duration: '1 hour',
        image: 'https://images.unsplash.com/photo-1587080413959-06b859fb107d?auto=format&fit=crop&q=80',
        description: 'Tour the historic tea factory where Lipton built his empire.',
        price: 'Free'
      },
      {
        name: 'Sunrise at Lipton\'s Seat',
        category: 'Viewpoint',
        duration: '3-4 hours',
        image: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
        description: 'Early morning hike to the viewpoint where Sir Thomas Lipton surveyed his tea empire.',
        price: 'Free'
      }
    ]
  },

  'galle': {
    slug: 'galle',
    name: 'Galle',
    tagline: 'Colonial Coastal Gem',
    description: 'A perfectly preserved colonial town with Dutch architecture, rampart walls, and pristine beaches.',
    heroImage: 'https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80',
    coordinates: [6.0535, 80.2210],
    region: 'Southern Province',
    highlights: [
      'Galle Fort',
      'Dutch Reformed Church',
      'Lighthouse',
      'Rampart Walk'
    ],
    stats: {
      elevation: 'Sea Level',
      temperature: '28°C',
      bestTime: 'November - April'
    },

    events: [],

    thingsToDo: [
      {
        name: 'Walk the Fort Ramparts',
        category: 'Culture',
        duration: '2 hours',
        image: 'https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80',
        description: 'Stroll along the historic Dutch rampart walls with ocean views.',
        price: 'Free'
      },
      {
        name: 'Visit Galle Lighthouse',
        category: 'Photography',
        duration: '30 mins',
        image: 'https://images.unsplash.com/photo-1552799446-159ba9523315?auto=format&fit=crop&q=80',
        description: 'Iconic lighthouse at the southern tip of the fort.',
        price: 'Free'
      }
    ]
  },

  'arugam-bay': {
    slug: 'arugam-bay',
    name: 'Arugam Bay',
    tagline: 'Surf Paradise',
    description: 'World-renowned surf destination with laid-back vibes, golden beaches, and perfect waves.',
    heroImage: 'https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80',
    coordinates: [6.8417, 81.8361],
    region: 'Eastern Province',
    highlights: [
      'World-Class Surfing',
      'Beach Culture',
      'Wildlife Safaris',
      'Fresh Seafood'
    ],
    stats: {
      elevation: 'Sea Level',
      temperature: '30°C',
      bestTime: 'April - October'
    },

    events: [],

    thingsToDo: [
      {
        name: 'Surf Main Point',
        category: 'Adventure',
        duration: 'Half/Full day',
        image: 'https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80',
        description: 'Catch world-class right-hand point break waves.',
        price: 'Board rental: Rs. 1500/day'
      },
      {
        name: 'Kumana National Park Safari',
        category: 'Wildlife',
        duration: '4-5 hours',
        image: 'https://images.unsplash.com/photo-1661768508643-e260f6f8e06c?auto=format&fit=crop&q=80',
        description: 'Spot elephants, crocodiles, and exotic birds.',
        price: 'From Rs. 8000'
      }
    ]
  },

  'sigiriya': {
    slug: 'sigiriya',
    name: 'Sigiriya',
    tagline: 'The Lion Rock',
    description: 'Ancient rock fortress rising 200m above the jungle, crowned with palace ruins and stunning frescoes.',
    heroImage: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
    coordinates: [7.9570, 80.7597],
    region: 'Central Province',
    highlights: [
      'Ancient Rock Fortress',
      'Mirror Wall',
      'Sigiriya Frescoes',
      'Water Gardens'
    ],
    stats: {
      elevation: '370m',
      temperature: '28°C',
      bestTime: 'January - April'
    },

    events: [],

    thingsToDo: [
      {
        name: 'Climb Sigiriya Rock',
        category: 'Heritage',
        duration: '3-4 hours',
        image: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
        description: 'Climb 1,200 steps to the ancient palace ruins at the summit.',
        price: '$36 (foreigners)'
      }
    ]
  }
};

export const getDestinationBySlug = (slug) => {
  return destinations[slug] || null;
};

export const getAllDestinations = () => {
  return Object.values(destinations);
};

// Get featured destinations (with featured events)
export const getFeaturedDestinations = () => {
  return Object.values(destinations).filter(dest =>
    dest.events.some(event => event.featured)
  );
};
