// Articles database
export const articles = {
  'kandy-perahera': {
    slug: 'kandy-perahera',
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
    location: {
      name: 'Kandy, Sri Lanka',
      coordinates: [7.2906, 80.6337]
    },
    readTime: 8,
    publishedDate: '2026-01-15',

    // Restaurants in Kandy
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
        name: "The Empire Café",
        type: "Colonial Tea Room",
        price: "Rs. 800 - 1500",
        rating: 4.4,
        description: "Step back in time at this 1900s colonial café serving Ceylon tea, scones, and light meals in a charming heritage setting.",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
        tags: ["Tea", "Colonial", "Café"],
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

  'ella-to-kandy': {
    slug: 'ella-to-kandy',
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
    location: {
      name: 'Ella to Kandy Railway',
      coordinates: [6.8667, 81.0456]
    },
    readTime: 12,
    publishedDate: '2025-12-10',

    content: {
      introduction: 'The train leaves Ella at dawn. Mist clings to the valleys below, and the first light catches the tea pickers already at work on impossible slopes. This is the slowest express in Sri Lanka—perhaps the world—and nobody minds. The journey itself is the destination.',

      sections: [
        {
          id: 'section-1',
          body: `The carriage doors stay open. Passengers lean out, cameras ready, as we wind through tunnels carved by British engineers a century ago. The track hugs cliff edges, crosses colonial-era bridges, and threads through tea estates that stretch to the horizon.

Between Ella and Kandy lie nine hours of the most spectacular railway scenery on earth. The train climbs from 1,041 meters at Ella to 1,900 meters at Pattipola—Sri Lanka's highest railway station—before descending into Kandy's lower hills.

The Second Class observation car is where everyone wants to be. It fills with backpackers, local families, and tea estate workers commuting between plantations. A vendor walks through selling wade (savory lentil donuts) and sweet tea in small glasses.`,

          highlight: {
            type: 'quote',
            content: 'This railway was never meant to be beautiful. It was built to haul tea from the highlands to Colombo. That it became one of the world\'s great train journeys was an accident of geography.'
          }
        },
        {
          id: 'section-2',
          heading: 'Through the Tea Country',
          body: `Past Haputale, the landscape transforms. Tea bushes carpet every surface in geometric precision. Women in bright saris move through the rows, plucking only the newest leaves—two leaves and a bud—into baskets strapped to their backs.

The estates have romantic names inherited from their colonial past: Dambatenne, Uva Halpewatte, Pedro. Each produces a distinct flavor profile shaped by altitude, soil, and the particular microclimate of its valley.

At Ohiya, the train stops for fifteen minutes. Passengers spill onto the platform to buy samosas and stretch their legs. The stationmaster, in his crisp white uniform, poses for photos with tourists. He's been working this line for thirty years and knows every curve and gradient by heart.`
        },
        {
          id: 'section-3',
          heading: 'The Nine Arch Bridge',
          body: `Though not visible from the train itself, the Nine Arch Bridge near Ella has become iconic—a graceful curve of stone arches spanning a jungle valley. Built entirely from stone and cement, without any steel, it's a testament to colonial-era engineering.

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
    },

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

    // Restaurants in Ella
    restaurants: [
      {
        name: "Chill Café",
        type: "International & Local",
        price: "Rs. 800 - 1800",
        rating: 4.7,
        description: "Relaxed rooftop café with stunning Ella Gap views. Great coffee, smoothie bowls, and Sri Lankan rice & curry.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80",
        tags: ["Rooftop", "Views", "Coffee"],
        coordinates: [6.8665, 81.0461],
        specialty: "Smoothie Bowls & Ceylon Coffee",
        hours: "7:00 AM - 10:00 PM"
      },
      {
        name: "Café Chill",
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
        name: "Dream Café",
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

  'dambatenne-liptons-trail': {
    slug: 'dambatenne-liptons-trail',
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
    location: {
      name: 'Dambatenne, Haputale',
      coordinates: [6.7833, 80.9667]
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

At Dambatenne, his original factory still operates. The machinery—massive rollers, oxidation troughs, drying racks—dates to the early 1900s. Tea processing has barely changed: pluck, wither, roll, oxidize, dry. The factory tour walks you through each step.`,

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

The trail winds through active tea fields. Pickers work in small groups, moving through the rows with practiced efficiency. They earn by weight—each kilo of leaf plucked adds to their daily tally. It's hard work, done mostly by Tamil women whose families have worked these estates for generations.

At the viewpoint, a small kiosk serves tea—naturally—and plain tea biscuits. The wind is cold and constant. Below, the landscape unfolds in shades of green: tea, forest, paddy fields in distant valleys. It's easy to see why Lipton chose this spot to contemplate his growing empire.`
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
    },

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

    // Restaurants in Haputale/Dambatenne
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
  }
};

export const getArticleBySlug = (slug) => {
  return articles[slug] || null;
};

export const getAllArticles = () => {
  return Object.values(articles);
};
