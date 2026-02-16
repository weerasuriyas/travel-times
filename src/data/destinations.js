// Destinations database - merged with articles data
import { parseISO, isWithinInterval, addDays, isBefore, isAfter, differenceInDays } from 'date-fns';

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
      temperature: '24\u00B0C',
      bestTime: 'July - August'
    },

    // General things to do in Kandy (destination-level activities)
    generalThingsToDo: [
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
    ],

    // Events happening in Kandy
    events: [
      {
        name: 'The Fire of Kandy',
        slug: 'kandy-perahera',
        type: 'Cultural Festival',
        month: 'July - August',
        season: 'July - August',
        duration: '10 nights',
        image: '/perahera_banner.jpg',
        description: 'The Esala Perahera draws more than a million pilgrims and tourists annually to witness this spectacular Buddhist festival.',
        featured: true,
        startDate: '2026-07-29',
        endDate: '2026-08-12',

        // Merged article data from articles.js
        article: {
          title: 'THE FIRE OF KANDY.',
          subtitle: 'We walked through the smoke of a thousand copra torches, following the rhythm of drums into the heart of the ancient kingdom.',
          category: 'Culture',
          tags: ['Festival', 'Heritage', 'Buddhist', 'Kandy'],
          issue: 'Issue 04: The Relic',
          author: {
            name: 'Sanath Weerasuriya',
            role: 'Field Correspondent',
            bio: 'Documenting the cultural heartbeat of Sri Lanka for over a decade.',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
          },
          readTime: 8,
          publishedDate: '2026-01-15',
          content: {
            introduction: 'The historic \'Esala Perahera\' in Kandy, one of the oldest and grandest Cultural festivals in Sri Lanka, perhaps, in the world started on Friday, 29 July with the cap planting (\'cap situveema\'). This will continue for 15 days with four Devala Peraheras, Kumbal Perahera and colourful Randoli followed by \'day perahera\' on Friday, 12th August.',
            sections: [
              {
                id: 'section-1',
                body: 'This year\'s \'Esala Perehara\' is the first grand pageant after two years with no restrictions due to Covid Pandemic but blessed with heavy showers and bad weather. Despite the warning of re-emerging of Covid threat massive crowds turned up for the Kumbal Perhaera on Tuesday and Wednesday.',
                highlight: {
                  type: 'quote',
                  content: '\'Esala Perahera\', for centuries, has drawn religious devotees from around the world and more recently tourists, to Kandy\'s narrow hill-streets.'
                }
              },
              {
                id: 'section-2',
                heading: 'The Procession',
                body: 'Heralded by thousands of Kandyan drummers, a host of majestic elephants, adorned in elaborately embroidered cloaks, are led by the brilliantly caparisoned Maligawa Tusker. Decorated from trunk to toe, he carries a huge canopy that shelters, a replica of the cask containing the Sacred Tooth Relic of the Lord Buddha.'
              },
              {
                id: 'section-3',
                heading: 'Ancient Tradition',
                body: 'The aged old tradition were never changed for the past 1500 years since 305 AD during the reign of King Kirthisiri Meghawanna (305-331 AD). After the Kandyan Kingdom fell to the British in 1815, the custody of the Relic was handed over to the Maha Sanga. In the absence of the king, a chief lay custodian \'Diyawadana Nilame\' was appointed to handle routine administrative matters concerning the relic and its care.'
              }
            ],
            featured: {
              heading: 'The Top Attraction',
              items: [
                {
                  name: 'LEAD TUSKER',
                  label: 'Sinha Raja',
                  description: 'Carrying the golden Karanduwa, Sinha Raja is the top attraction of the Perahera this year.',
                  details: {
                    guard: 'Flanked by Myan Raja and Buruma Raja on either side',
                    formation: 'Sacred Formation'
                  }
                }
              ]
            }
          }
        },

        // Things to do specific to this event
        thingsToDo: [
          {
            title: 'Temple of the Tooth',
            category: 'Sacred Site',
            description: 'Home to Sri Lanka\'s most sacred Buddhist relic, this UNESCO World Heritage Site is a must-visit for understanding the island\'s spiritual heritage.',
            image: 'https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80',
            duration: '2-3 hours',
            price: 'Free (donations welcome)',
            tags: ['Religious', 'Heritage', 'Must-See']
          },
          {
            title: 'Kandy Lake',
            category: 'Nature',
            description: 'A serene man-made lake in the heart of the city. Perfect for morning or evening walks with stunning views of the surrounding hills.',
            image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800',
            duration: '1 hour',
            price: 'Free',
            tags: ['Walking', 'Scenic', 'Relaxing']
          },
          {
            title: 'Royal Botanical Gardens',
            category: 'Gardens',
            description: 'Asia\'s finest tropical gardens featuring over 4,000 species of plants, including a stunning orchid collection and giant Javan fig tree.',
            image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80',
            duration: '2-4 hours',
            price: '$10',
            tags: ['Nature', 'Gardens', 'Family']
          },
          {
            title: 'Kandyan Dance Show',
            category: 'Culture',
            description: 'Experience the vibrant traditional dances and music of the Kandyan kingdom, including fire walking and acrobatic performances.',
            image: 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80',
            duration: '1 hour',
            price: '$8-12',
            tags: ['Cultural', 'Evening', 'Performance']
          },
          {
            title: 'Tea Plantation Visit',
            category: 'Experience',
            description: 'Tour a working tea estate, learn about Ceylon tea production, and enjoy fresh tea with panoramic mountain views.',
            image: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
            duration: 'Half day',
            price: '$15-30',
            tags: ['Tea', 'Scenic', 'Educational']
          },
          {
            title: 'Udawattakele Forest',
            category: 'Nature',
            description: 'A biodiverse forest sanctuary above the city, home to rare birds, monkeys, and ancient trees. A peaceful escape from urban bustle.',
            image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80',
            duration: '2-3 hours',
            price: '$5',
            tags: ['Hiking', 'Wildlife', 'Nature']
          }
        ],

        // Accommodations for this event
        accommodations: [
          {
            name: "Queen's Hotel",
            type: "Heritage Listed",
            price: "$80 - $150",
            rating: 4.2,
            description: "A colonial gem located right in the heart of the city, adjacent to the Temple of the Tooth. Features high ceilings, wooden floors, and a historic ballroom.",
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
            tags: ["Historic", "Central", "Colonial"],
            coordinates: [7.2928, 80.6405]
          },
          {
            name: "The Grand Kandian",
            type: "Modern Luxury",
            price: "$150 - $250",
            rating: 4.5,
            description: "Perched on the hilltops, this palace-like hotel offers panoramic views of the entire Kandy valley. Known for its lavish interiors and rooftop pool.",
            image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800",
            tags: ["Luxury", "Views", "Pool"],
            coordinates: [7.3000, 80.6300]
          },
          {
            name: "Suisse Hotel",
            type: "Colonial Lakeview",
            price: "$62 - $120",
            rating: 8.2,
            description: "Housed in a restored 17th-century colonial building that was once the residence of a Chief Minister. Offers lush gardens and direct lake views.",
            image: "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800",
            tags: ["Heritage", "Lake View", "Gardens"],
            coordinates: [7.2888, 80.6432]
          },
          {
            name: "The Kandy House",
            type: "Boutique Manor",
            price: "$250 - $400",
            rating: 4.8,
            description: "An ancestral manor house converted into a designer boutique hotel. Features lush gardens and an infinity pool overlooking the paddy fields.",
            image: "https://lh3.googleusercontent.com/p/AF1QipN3vM-YQy-t7C-lC2fG4d8n7j9kH6xX5ZqWz3eR=s1360-w1360-h1020",
            tags: ["Heritage", "Luxury", "Secluded"],
            coordinates: [7.3128, 80.6552]
          },
          {
            name: "Earl's Regency",
            type: "Luxury Resort",
            price: "$150 - $300",
            rating: 4.6,
            description: "A 5-star hotel located along the Mahaweli River, offering premium amenities and easy access to Kandy's main attractions.",
            image: "https://lh3.googleusercontent.com/p/AF1QipO9n_qX5ZqWz3eR-lC2fG4d8n7j9kH6xX5ZqW=s1360-w1360-h1020",
            tags: ["Riverside", "Spa", "Family"],
            coordinates: [7.2885, 80.6625]
          },
          {
            name: "Helga's Folly",
            type: "Art Hotel",
            price: "$120 - $200",
            rating: 4.4,
            description: "A whimsical, anti-hotel filled with art, murals, and history. A favorite of artists and writers seeking inspiration.",
            image: "https://lh3.googleusercontent.com/p/AF1QipM-xX5ZqWz3eR-lC2fG4d8n7j9kH6xX5ZqW=s1360-w1360-h1020",
            tags: ["Artistic", "Historic", "Bohemian"],
            coordinates: [7.2936, 80.6481]
          }
        ],

        // Restaurants for this event
        restaurants: [
          {
            name: "White House Restaurant",
            type: "Traditional Sri Lankan",
            price: "Rs. 1500 - 3000",
            rating: 4.6,
            description: "Authentic Kandyan cuisine with rice and curry featuring over 15 curries daily. Family-run establishment serving generations-old recipes.",
            image: "https://images.unsplash.com/photo-1687688207113-34bea1617467?auto=format&fit=crop&q=80",
            tags: ["Rice & Curry", "Local", "Traditional"],
            coordinates: [7.2945, 80.6380],
            specialty: "Kandyan Rice & Curry",
            hours: "11:00 AM - 10:00 PM"
          },
          {
            name: "The Empire Caf\u00E9",
            type: "Colonial Tea Room",
            price: "Rs. 800 - 1500",
            rating: 4.4,
            description: "Step back in time at this 1900s colonial caf\u00E9 serving Ceylon tea, scones, and light meals in a charming heritage setting.",
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
            tags: ["Tea", "Colonial", "Caf\u00E9"],
            coordinates: [7.2925, 80.6398],
            specialty: "High Tea & Pastries",
            hours: "8:00 AM - 8:00 PM"
          },
          {
            name: "Balaji Dosai",
            type: "South Indian",
            price: "Rs. 300 - 800",
            rating: 4.5,
            description: "Popular spot for crispy dosa, fluffy idli, and aromatic sambar. Always packed with locals and visitors alike.",
            image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80",
            tags: ["Vegetarian", "South Indian", "Budget"],
            coordinates: [7.2932, 80.6363],
            specialty: "Masala Dosa",
            hours: "7:00 AM - 9:00 PM"
          },
          {
            name: "Slightly Chilled Lounge Bar",
            type: "Fusion & Cocktails",
            price: "Rs. 2000 - 4000",
            rating: 4.7,
            description: "Rooftop bar and restaurant with stunning lake views. Modern fusion cuisine paired with creative cocktails.",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80",
            tags: ["Rooftop", "Cocktails", "Fusion"],
            coordinates: [7.2918, 80.6410],
            specialty: "Fusion Tapas & Craft Cocktails",
            hours: "4:00 PM - 11:00 PM"
          },
          {
            name: "Helga's Folly",
            type: "Eclectic Fine Dining",
            price: "Rs. 3500 - 6000",
            rating: 4.8,
            description: "Eccentric art-filled mansion serving exquisite Sri Lankan-European fusion. Every surface is a canvas, every meal an experience.",
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80",
            tags: ["Fine Dining", "Art", "Unique"],
            coordinates: [7.2875, 80.6290],
            specialty: "Sri Lankan Fusion",
            hours: "Reservation Only"
          },
          {
            name: "Devon Restaurant",
            type: "Bakery & Quick Bites",
            price: "Rs. 200 - 600",
            rating: 4.2,
            description: "Local chain famous for fresh baked goods, short eats, and strong coffee. Perfect for breakfast on the go.",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80",
            tags: ["Bakery", "Quick Bites", "Coffee"],
            coordinates: [7.2958, 80.6355],
            specialty: "Fresh Pastries & Short Eats",
            hours: "6:00 AM - 9:00 PM"
          }
        ]
      },
      {
        name: 'Kandy Cultural Show',
        slug: 'kandy-cultural-show',
        type: 'Daily Performance',
        month: 'Year-round',
        season: 'Year-round',
        duration: '1 hour',
        image: 'https://images.unsplash.com/photo-1599874811937-be93d8dd9fac?auto=format&fit=crop&q=80',
        description: 'Traditional Kandyan dancing, fire walking, and drumming performances every evening.',
        featured: false,
        startDate: null,
        endDate: null,
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
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
      temperature: '18\u00B0C',
      bestTime: 'December - March'
    },

    // General things to do in Ella (destination-level activities)
    generalThingsToDo: [
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
    ],

    events: [
      {
        name: 'Ella to Kandy: The Slowest Express',
        slug: 'ella-to-kandy',
        type: 'Scenic Journey',
        month: 'Year-round',
        season: 'Year-round',
        duration: '9 hours',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        description: 'One of the world\'s most beautiful train journeys through tea country.',
        featured: true,
        startDate: null,
        endDate: null,

        // Merged article data from articles.js
        article: {
          title: 'ELLA TO KANDY.',
          subtitle: 'The train carved through emerald mountains, each curve revealing another postcard of Ceylon\'s hill country.',
          category: 'Journey',
          tags: ['Train', 'Tea', 'Scenic', 'Ella', 'Kandy', 'Hills'],
          issue: 'Issue 03: The Rails',
          author: {
            name: 'Nadeesha Perera',
            role: 'Travel Correspondent',
            bio: 'Chasing horizons and capturing stories from Sri Lanka\'s railways.',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
          },
          readTime: 12,
          publishedDate: '2025-12-10',
          content: {
            introduction: 'The train leaves Ella at dawn. Mist clings to the valleys below, and the first light catches the tea pickers already at work on impossible slopes. This is the slowest express in Sri Lanka\u2014perhaps the world\u2014and nobody minds. The journey itself is the destination.',
            sections: [
              {
                id: 'section-1',
                body: `The carriage doors stay open. Passengers lean out, cameras ready, as we wind through tunnels carved by British engineers a century ago. The track hugs cliff edges, crosses colonial-era bridges, and threads through tea estates that stretch to the horizon.

Between Ella and Kandy lie nine hours of the most spectacular railway scenery on earth. The train climbs from 1,041 meters at Ella to 1,900 meters at Pattipola\u2014Sri Lanka's highest railway station\u2014before descending into Kandy's lower hills.

The Second Class observation car is where everyone wants to be. It fills with backpackers, local families, and tea estate workers commuting between plantations. A vendor walks through selling wade (savory lentil donuts) and sweet tea in small glasses.`,
                highlight: {
                  type: 'quote',
                  content: 'This railway was never meant to be beautiful. It was built to haul tea from the highlands to Colombo. That it became one of the world\'s great train journeys was an accident of geography.'
                }
              },
              {
                id: 'section-2',
                heading: 'Through the Tea Country',
                body: `Past Haputale, the landscape transforms. Tea bushes carpet every surface in geometric precision. Women in bright saris move through the rows, plucking only the newest leaves\u2014two leaves and a bud\u2014into baskets strapped to their backs.

The estates have romantic names inherited from their colonial past: Dambatenne, Uva Halpewatte, Pedro. Each produces a distinct flavor profile shaped by altitude, soil, and the particular microclimate of its valley.

At Ohiya, the train stops for fifteen minutes. Passengers spill onto the platform to buy samosas and stretch their legs. The stationmaster, in his crisp white uniform, poses for photos with tourists. He's been working this line for thirty years and knows every curve and gradient by heart.`
              },
              {
                id: 'section-3',
                heading: 'The Nine Arch Bridge',
                body: `Though not visible from the train itself, the Nine Arch Bridge near Ella has become iconic\u2014a graceful curve of stone arches spanning a jungle valley. Built entirely from stone and cement, without any steel, it's a testament to colonial-era engineering.

Train spotters gather there daily, timing their arrival for when the train crosses. The sight of the blue locomotive emerging from the trees, crossing the bridge, and disappearing back into the jungle has launched a thousand Instagram posts.

But the real magic isn't in any single landmark. It's in the accumulation of moments: a child waving from a village as the train passes, mist clearing to reveal a perfect valley, the rattle and sway of the carriage lulling you into a meditative state.`
              }
            ],
            featured: {
              heading: 'Journey Essentials',
              items: [
                {
                  name: 'THE BEST SEAT',
                  label: 'Left Side, Second Class',
                  description: 'Book the left side of the carriage heading from Ella to Kandy for the best valley views. Second class observation cars offer open doors and windows.',
                  details: {
                    cost: 'Rs. 350 (~$1.20)',
                    bookAhead: 'Reserve 30 days in advance online or at the station'
                  }
                },
                {
                  name: 'TIMING',
                  label: 'Morning Departure',
                  description: 'The 8:47 AM train from Ella arrives in Kandy at 5:30 PM. Clear weather is most likely in the morning hours.',
                  details: {
                    alternative: 'Ella to Nanu Oya (4 hours) is equally scenic',
                    peak: 'Avoid December-January tourist rush'
                  }
                },
                {
                  name: 'WHAT TO BRING',
                  label: 'Journey Supplies',
                  description: 'Light jacket for highland chill, water, snacks from Ella market, fully charged camera. The buffet car serves basic meals.',
                  details: {
                    essentials: 'Sunscreen, hat, small backpack',
                    optional: 'Binoculars for distant tea estates'
                  }
                }
              ]
            }
          }
        },

        // Things to do specific to this event
        thingsToDo: [],

        // Accommodations from the article
        accommodations: [
          {
            name: "98 Acres Resort & Spa",
            type: "Luxury Resort",
            price: "$200 - $350",
            rating: 4.8,
            description: "Perched on a hill with panoramic views of Ella Gap, this resort offers tea-estate luxury with infinity pools overlooking the valleys.",
            image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80",
            tags: ["Luxury", "Views", "Spa"],
            coordinates: [6.8667, 81.0456]
          },
          {
            name: "Oak Ray Ella Gap Hotel",
            type: "Mid-Range Hotel",
            price: "$80 - $120",
            rating: 4.3,
            description: "Family-run hotel with cozy rooms and a restaurant serving Sri Lankan specialties. Short walk to Ella town center.",
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
            tags: ["Family-Friendly", "Central", "Restaurant"],
            coordinates: [6.8667, 81.0456]
          }
        ],

        // Restaurants from the article
        restaurants: [
          {
            name: "Chill Caf\u00E9",
            type: "International & Local",
            price: "Rs. 800 - 1800",
            rating: 4.7,
            description: "Relaxed rooftop caf\u00E9 with stunning Ella Gap views. Great coffee, smoothie bowls, and Sri Lankan rice & curry.",
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80",
            tags: ["Rooftop", "Views", "Coffee"],
            coordinates: [6.8665, 81.0461],
            specialty: "Smoothie Bowls & Ceylon Coffee",
            hours: "7:00 AM - 10:00 PM"
          },
          {
            name: "Caf\u00E9 Chill",
            type: "Backpacker Favorite",
            price: "Rs. 500 - 1200",
            rating: 4.4,
            description: "Budget-friendly spot popular with travelers. Generous portions, fresh juices, and live music most evenings.",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
            tags: ["Budget", "Live Music", "Social"],
            coordinates: [6.8669, 81.0458],
            specialty: "Kottu Roti & Fresh Juices",
            hours: "8:00 AM - 11:00 PM"
          },
          {
            name: "Dream Caf\u00E9",
            type: "International Cuisine",
            price: "Rs. 900 - 2000",
            rating: 4.6,
            description: "Garden setting with eclectic menu featuring wood-fired pizzas, pasta, and Asian fusion dishes.",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80",
            tags: ["Pizza", "Garden", "Fusion"],
            coordinates: [6.8672, 81.0454],
            specialty: "Wood-Fired Pizza",
            hours: "11:00 AM - 10:30 PM"
          }
        ]
      },
      {
        name: 'Ella Hiking Season',
        slug: 'ella-hiking-season',
        type: 'Outdoor Adventure',
        month: 'December - March',
        season: 'December - March',
        duration: 'Season',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80',
        description: 'The dry season brings clear skies and perfect conditions for trekking Ella Rock and Little Adam\'s Peak.',
        featured: false,
        startDate: null,
        endDate: null,
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
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
      temperature: '16\u00B0C',
      bestTime: 'March - September'
    },

    // General things to do in Haputale (destination-level activities)
    generalThingsToDo: [
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
    ],

    events: [
      {
        name: 'Dambatenne: Lipton\'s Lost Trail',
        slug: 'dambatenne-liptons-trail',
        type: 'Heritage Trail',
        month: 'Year-round',
        season: 'Year-round',
        duration: 'Full day',
        image: 'https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80',
        description: 'Explore Sir Thomas Lipton\'s tea empire at the historic Dambatenne factory.',
        featured: true,
        startDate: null,
        endDate: null,

        // Merged article data from articles.js
        article: {
          title: 'DAMBATENNE.',
          subtitle: 'Where Thomas Lipton built his tea empire, the machines still turn, and the leaves still steep in copper vats untouched by time.',
          category: 'Heritage',
          tags: ['Tea', 'Heritage', 'Colonial', 'Dambatenne', 'Lipton'],
          issue: 'Issue 02: The Leaf',
          author: {
            name: 'Anura Fernando',
            role: 'Heritage Writer',
            bio: 'Documenting Sri Lanka\'s colonial past and agricultural traditions.',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
          },
          readTime: 10,
          publishedDate: '2025-11-22',
          content: {
            introduction: 'The road to Dambatenne climbs through tea estates planted in the 1890s. Around every hairpin bend, another vista opens: valleys stitched with emerald bushes, distant mountains floating in mist, the occasional estate bungalow with its red roof and colonial veranda.',
            sections: [
              {
                id: 'section-1',
                body: `Sir Thomas Lipton arrived in Ceylon in 1890 with ambition and capital. He bought five estates at auction, including Dambatenne, and set about revolutionizing the tea trade. His innovation was simple: cut out the middlemen, control the entire process from bush to cup, and sell directly to consumers back in Britain.

"Direct from the Tea Gardens to the Tea Pot" became his slogan. He packaged tea in small, affordable quantities and plastered London with advertisements. Within a decade, Lipton's had become a household name.

At Dambatenne, his original factory still operates. The machinery\u2014massive rollers, oxidation troughs, drying racks\u2014dates to the early 1900s. Tea processing has barely changed: pluck, wither, roll, oxidize, dry. The factory tour walks you through each step.`,
                highlight: {
                  type: 'quote',
                  content: 'Lipton never lived to see tea bags become ubiquitous, but he pioneered the packaging and marketing that made tea drinking democratic. Ceylon tea built his fortune, and Dambatenne was its crown jewel.'
                }
              },
              {
                id: 'section-2',
                heading: 'Inside the Factory',
                body: `The withering loft smells of fresh grass and sunshine. Newly plucked leaves spread across mesh beds, slowly losing moisture. Below, the rolling machines crack and bruise the leaves, releasing enzymes that trigger oxidation.

The color change is dramatic: green leaves turn copper, then deep brown. The oxidation master monitors the process, checking temperature and humidity, judging readiness by color, smell, and experience accumulated over decades.

Finally, the dryer: a massive heated chamber where leaves crisp and curl. The finished product emerges at the other end, ready for grading, packing, and auction at the Colombo Tea Exchange.`
              },
              {
                id: 'section-3',
                heading: 'Lipton\'s Seat',
                body: `A three-kilometer walk from the factory leads to Lipton's Seat, the viewpoint where Sir Thomas would survey his empire. On a clear morning, you can see across five provinces. The sunrise here is legendary among tea estate workers.

The trail winds through active tea fields. Pickers work in small groups, moving through the rows with practiced efficiency. They earn by weight\u2014each kilo of leaf plucked adds to their daily tally. It's hard work, done mostly by Tamil women whose families have worked these estates for generations.

At the viewpoint, a small kiosk serves tea\u2014naturally\u2014and plain tea biscuits. The wind is cold and constant. Below, the landscape unfolds in shades of green: tea, forest, paddy fields in distant valleys. It's easy to see why Lipton chose this spot to contemplate his growing empire.`
              }
            ],
            featured: {
              heading: 'Visitor Information',
              items: [
                {
                  name: 'FACTORY TOUR',
                  label: 'Dambatenne Tea Factory',
                  description: 'Free guided tours daily from 8 AM to 4 PM. Best visited during harvest season (March-April, July-September) when the factory is in full operation.',
                  details: {
                    duration: '45 minutes',
                    includes: 'Tea tasting and factory shop'
                  }
                },
                {
                  name: 'THE HIKE',
                  label: 'Lipton\'s Seat Trail',
                  description: 'Start early (5 AM) to catch sunrise from the viewpoint. The 3km trail takes about an hour each way through working tea estates.',
                  details: {
                    difficulty: 'Moderate',
                    bring: 'Warm jacket, water, good shoes'
                  }
                },
                {
                  name: 'TEA SHOPPING',
                  label: 'Direct from Source',
                  description: 'The factory shop sells Dambatenne tea at wholesale prices. Orange Pekoe and Broken Orange Pekoe grades are excellent value.',
                  details: {
                    prices: 'Rs. 600-1200 per kg',
                    shipping: 'Available to Colombo hotels'
                  }
                }
              ]
            }
          }
        },

        // Things to do specific to this event
        thingsToDo: [],

        // Accommodations from the article
        accommodations: [
          {
            name: "Melheim Resort",
            type: "Colonial Heritage",
            price: "$120 - $180",
            rating: 4.6,
            description: "Converted tea estate bungalow with period furnishings, maintained gardens, and sweeping views of the Uva valley.",
            image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80",
            tags: ["Heritage", "Luxury", "Views"],
            coordinates: [6.7833, 80.9667]
          },
          {
            name: "Haputale Rest House",
            type: "Budget Stay",
            price: "$30 - $50",
            rating: 4.0,
            description: "Simple rooms with hot water and mountain views. Local restaurant serves excellent rice and curry.",
            image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80",
            tags: ["Budget", "Local", "Clean"],
            coordinates: [6.7833, 80.9667]
          }
        ],

        // Restaurants from the article
        restaurants: [
          {
            name: "Tea Bush Restaurant",
            type: "Sri Lankan & Chinese",
            price: "Rs. 600 - 1500",
            rating: 4.3,
            description: "Family restaurant serving hearty Sri Lankan rice & curry and popular Chinese dishes. Warm atmosphere with mountain views.",
            image: "https://images.unsplash.com/photo-1687688207113-34bea1617467?auto=format&fit=crop&q=80",
            tags: ["Rice & Curry", "Chinese", "Family"],
            coordinates: [6.7685, 80.9595],
            specialty: "Deviled Chicken & Fried Rice",
            hours: "9:00 AM - 9:00 PM"
          },
          {
            name: "Ravi's Restaurant",
            type: "Local Meals",
            price: "Rs. 400 - 900",
            rating: 4.5,
            description: "Simple local eatery beloved by tea estate workers. Authentic home-style cooking at unbeatable prices.",
            image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80",
            tags: ["Local", "Budget", "Authentic"],
            coordinates: [6.7695, 80.9605],
            specialty: "Estate Worker's Rice & Curry",
            hours: "7:00 AM - 8:00 PM"
          },
          {
            name: "Olympus Plaza Restaurant",
            type: "Multi-Cuisine",
            price: "Rs. 800 - 1800",
            rating: 4.2,
            description: "Popular stop for tea factory visitors. Mixed menu with kottu, rice & curry, and Western options.",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80",
            tags: ["Kottu", "Mixed Menu", "Tourist Friendly"],
            coordinates: [6.7710, 80.9620],
            specialty: "Kottu Roti",
            hours: "8:00 AM - 9:00 PM"
          }
        ]
      },
      {
        name: 'Tea Plucking Season',
        slug: 'tea-plucking-season',
        type: 'Cultural Experience',
        month: 'March - May',
        season: 'March - May',
        duration: 'Season',
        image: 'https://images.unsplash.com/photo-1587080413959-06b859fb107d?auto=format&fit=crop&q=80',
        description: 'Watch and participate in the first flush tea harvest at Dambatenne estate.',
        featured: false,
        startDate: '2026-03-01',
        endDate: '2026-05-31',
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
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
      temperature: '28\u00B0C',
      bestTime: 'November - April'
    },

    // General things to do in Galle (destination-level activities)
    generalThingsToDo: [
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
    ],

    events: [
      {
        name: 'Galle Literary Festival',
        slug: 'galle-literary-festival',
        type: 'Cultural Festival',
        month: 'January',
        season: 'January',
        duration: '4 days',
        image: 'https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80',
        description: 'Asia\'s leading literary festival bringing together world-renowned authors inside the historic fort.',
        featured: true,
        startDate: '2026-01-21',
        endDate: '2026-01-24',
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
      },
      {
        name: 'Southern Beach Season',
        slug: 'southern-beach-season',
        type: 'Seasonal',
        month: 'November - April',
        season: 'November - April',
        duration: 'Season',
        image: 'https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80',
        description: 'Calm seas, whale watching season, and perfect beach weather along the southern coast.',
        featured: false,
        startDate: null,
        endDate: null,
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
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
      temperature: '30\u00B0C',
      bestTime: 'April - October'
    },

    // General things to do in Arugam Bay (destination-level activities)
    generalThingsToDo: [
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
    ],

    events: [
      {
        name: 'Surf Season Opens',
        slug: 'surf-season-opens',
        type: 'Seasonal',
        month: 'April - October',
        season: 'April - October',
        duration: 'Season',
        image: 'https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80',
        description: 'The east coast lights up with perfect swells, international surf competitions, and beach festivals.',
        featured: true,
        startDate: null,
        endDate: null,
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
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
      temperature: '28\u00B0C',
      bestTime: 'January - April'
    },

    // General things to do in Sigiriya (destination-level activities)
    generalThingsToDo: [
      {
        name: 'Climb Sigiriya Rock',
        category: 'Heritage',
        duration: '3-4 hours',
        image: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
        description: 'Climb 1,200 steps to the ancient palace ruins at the summit.',
        price: '$36 (foreigners)'
      }
    ],

    events: [
      {
        name: 'Sunrise at Lion Rock',
        slug: 'sunrise-at-lion-rock',
        type: 'Experience',
        month: 'January - April',
        season: 'January - April',
        duration: 'Half day',
        image: 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&q=80',
        description: 'The dry season offers crystal-clear sunrise views from the summit of this ancient fortress.',
        featured: true,
        startDate: null,
        endDate: null,
        article: null,
        thingsToDo: [],
        accommodations: [],
        restaurants: []
      }
    ]
  }
};

// --- Helper Functions ---

export const getDestinationBySlug = (slug) => destinations[slug] || null;
export const getAllDestinations = () => Object.values(destinations);

// Get a single event by slug (searches all destinations)
export const getEventBySlug = (slug) => {
  for (const dest of Object.values(destinations)) {
    const event = dest.events.find(e => e.slug === slug);
    if (event) return { ...event, destination: { slug: dest.slug, name: dest.name, region: dest.region } };
  }
  return null;
};

// Get all events across all destinations
export const getAllEvents = () => {
  const events = [];
  for (const dest of Object.values(destinations)) {
    for (const event of dest.events) {
      events.push({ ...event, destination: { slug: dest.slug, name: dest.name, region: dest.region } });
    }
  }
  return events;
};

// Check if event is happening now
export const isHappeningNow = (event) => {
  if (!event.startDate || !event.endDate) return false;
  const now = new Date();
  return isWithinInterval(now, { start: parseISO(event.startDate), end: parseISO(event.endDate) });
};

// Check if event is happening soon (within 30 days)
export const isHappeningSoon = (event) => {
  if (!event.startDate) return false;
  const now = new Date();
  const start = parseISO(event.startDate);
  return isAfter(start, now) && isBefore(start, addDays(now, 30));
};

// Get days until event starts
export const daysUntilEvent = (event) => {
  if (!event.startDate) return null;
  return differenceInDays(parseISO(event.startDate), new Date());
};

// Check if seasonal event matches current month
export const isInSeason = (event) => {
  if (!event.season || event.season === 'Year-round') return event.season === 'Year-round';
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = monthNames[new Date().getMonth()];
  return event.season.toLowerCase().includes(currentMonth.toLowerCase());
};

// Get upcoming/timely events across all destinations (for homepage "Happening Soon")
export const getTimelyEvents = () => {
  const all = getAllEvents();
  const happeningNow = all.filter(isHappeningNow);
  const happeningSoon = all.filter(e => !isHappeningNow(e) && isHappeningSoon(e));
  const inSeason = all.filter(e => !isHappeningNow(e) && !isHappeningSoon(e) && isInSeason(e));
  return [...happeningNow, ...happeningSoon, ...inSeason];
};

// Get events for a destination, sorted by relevance
export const getEventsForDestination = (slug) => {
  const dest = destinations[slug];
  if (!dest) return [];
  return dest.events.sort((a, b) => {
    const aScore = isHappeningNow(a) ? 3 : isHappeningSoon(a) ? 2 : isInSeason(a) ? 1 : 0;
    const bScore = isHappeningNow(b) ? 3 : isHappeningSoon(b) ? 2 : isInSeason(b) ? 1 : 0;
    return bScore - aScore;
  });
};

// Get featured destinations (with featured events)
export const getFeaturedDestinations = () => {
  return Object.values(destinations).filter(dest =>
    dest.events.some(event => event.featured)
  );
};

// Get featured timely events for the homepage spotlight
export const getFeaturedTimelyEvents = () => {
  return getTimelyEvents().filter(e => e.featured || isHappeningNow(e) || isHappeningSoon(e));
};
