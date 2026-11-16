export const CAFE_INFO = {
  nameAr: "روست آند بيري كافيه",
  nameEn: "Roast & Berry Cafe",
  taglineAr: "قهوة مختصة • فطار • أطباق عالمية • عصائر فريش",
  taglineEn: "Specialty Coffee • Breakfast • All-Day Dining • Fresh Juices",
  addressAr: "شارع التسعين الشمالي، التجمع الخامس، القاهرة",
  addressEn: "North 90th St, Fifth Settlement, Cairo",
  workingHoursAr: "يومياً من 8:00 صباحاً حتى 2:00 بعد منتصف الليل",
  workingHoursEn: "Daily from 8:00 AM to 2:00 AM",
  wifiName: "RoastBerry_5G",
  wifiPass: "RB@2026#Cafe",
  hotline: "01009694831",
  whatsapp: "201009694831",
  instagram: "@roastandberry.eg",
  taxRate: 0.14,
  adminPin: "1234"
};

export const CATEGORIES = [
  { id: "all", nameAr: "الكل", nameEn: "All", icon: "utensils" },
  { id: "breakfast", nameAr: "فطار الصباح", nameEn: "Breakfast", icon: "sun" },
  { id: "mains", nameAr: "أطباق رئيسية وباستا", nameEn: "Mains & Pasta", icon: "flame" },
  { id: "sandwiches", nameAr: "ساندوتشات وبرجر", nameEn: "Sandwiches & Burgers", icon: "sandwich" },
  { id: "hot_coffee", nameAr: "قهوة ومشروبات ساخنة", nameEn: "Hot Coffee & Tea", icon: "coffee" },
  { id: "fresh_juice", nameAr: "عصائر فريش وسموذي", nameEn: "Fresh Juices & Smoothies", icon: "citrus" },
  { id: "iced_drinks", nameAr: "آيس كوفي وموهيتو", nameEn: "Iced Coffee & Mojitos", icon: "snowflake" },
  { id: "desserts", nameAr: "حلويات ووافل", nameEn: "Desserts & Waffles", icon: "cake" },
  { id: "extras", nameAr: "مياه وسلطات وإضافات", nameEn: "Water, Salads & Sides", icon: "droplets" }
];

export const INITIAL_MENU_ITEMS = [
  // ================= 1. فطار الصباح =================
  {
    id: "brk-1",
    category: "breakfast",
    nameAr: "فطار مصري على أصوله",
    nameEn: "Authentic Egyptian Breakfast",
    descAr: "فول بالزيت الحار والطحينة، طعمية سخنة محشية، جبنة بالطماطم، بيض أومليت، وعيش بلدي طازة.",
    descEn: "Fava beans with flaxseed oil, stuffed falafel, feta with tomatoes, omelet & fresh baladi bread.",
    price: 115,
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
    available: true,
    badgeAr: "الأكثر طلباً",
    badgeEn: "Bestseller",
    sizes: [],
    addons: [
      { nameAr: "بطاطس محمرة", nameEn: "French Fries", price: 35 },
      { nameAr: "شاي بالنعناع", nameEn: "Mint Tea", price: 25 }
    ]
  },
  {
    id: "brk-2",
    category: "breakfast",
    nameAr: "أومليت تركي ومشروم",
    nameEn: "Smoked Turkey & Mushroom Omelet",
    descAr: "3 بيضات مخفوقة مع شرائح رومي مدخن، مشروم فريش، جبنة شيدر سايحة، وتوست محمص.",
    descEn: "3 whipped eggs with smoked turkey, fresh mushrooms, melted cheddar & toasted bread.",
    price: 135,
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "إكسترا جبنة شيدر", nameEn: "Extra Cheddar", price: 25 }]
  },
  {
    id: "brk-3",
    category: "breakfast",
    nameAr: "كرواسون زبدة فرنسي بالجبنة",
    nameEn: "French Butter Cheese Croissant",
    descAr: "كرواسون مخبوز يومياً محشي ميكس جبن جودة وشيدر مع خس كابوتشا وطماطم شيري.",
    descEn: "Freshly baked butter croissant stuffed with gouda, cheddar, lettuce & cherry tomatoes.",
    price: 95,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "رومي مدخن", nameEn: "Smoked Turkey", price: 30 }]
  },
  {
    id: "brk-4",
    category: "breakfast",
    nameAr: "بان كيك بالعسل والفواكه",
    nameEn: "Honey & Fresh Berries Pancake",
    descAr: "3 طبقات بان كيك هش يقدم مع عسل نحل طبيعي، فراولة طازجة، وتوت بري.",
    descEn: "3 fluffy pancake layers served with pure bee honey, fresh strawberries & blueberries.",
    price: 110,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "صوص نوتيلا", nameEn: "Nutella Sauce", price: 25 }]
  },

  // ================= 2. أطباق رئيسية وباستا =================
  {
    id: "main-1",
    category: "mains",
    nameAr: "تشيكن ألفريدو باستا",
    nameEn: "Chicken Alfredo Pasta",
    descAr: "مكرونة فيتوتشيني بصوص الكريمة الغني، صدور دجاج مشوية، مشروم فريش، وجبنة بارميزان.",
    descEn: "Fettuccine pasta in rich white cream sauce, grilled chicken breast, mushrooms & parmesan.",
    price: 195,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80",
    available: true,
    badgeAr: "شيف سبيشال",
    badgeEn: "Chef Special",
    sizes: [],
    addons: [
      { nameAr: "إكسترا دجاج مشوي", nameEn: "Extra Grilled Chicken", price: 55 },
      { nameAr: "إكسترا بارميزان", nameEn: "Extra Parmesan", price: 30 }
    ]
  },
  {
    id: "main-2",
    category: "mains",
    nameAr: "صدور دجاج مشوية بالروزماري",
    nameEn: "Rosemary Grilled Chicken",
    descAr: "قطعتين صدور دجاج متبلة بالأعشاب، تقدم مع أرز بسمتي أبيض وخضار سوتيه.",
    descEn: "Two herb-marinated grilled chicken breasts served with white basmati rice & sautéed veggies.",
    price: 210,
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80",
    available: true,
    sizes: [],
    addons: [
      { nameAr: "صوص مشروم", nameEn: "Mushroom Sauce", price: 30 },
      { nameAr: "بطاطس ويدجز", nameEn: "Potato Wedges", price: 40 }
    ]
  },
  {
    id: "main-3",
    category: "mains",
    nameAr: "بيني أرابياتا بالزيتون",
    nameEn: "Penne Arrabbiata",
    descAr: "مكرونة بيني بصوص الطماطم الإيطالي الحار، ثوم، ريحان فريش، وزيتون أسود.",
    descEn: "Penne pasta in spicy Italian tomato sauce, garlic, fresh basil & black olives.",
    price: 155,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "صدور دجاج مشوية", nameEn: "Grilled Chicken", price: 55 }]
  },
  {
    id: "main-4",
    category: "mains",
    nameAr: "بيف ستروجانوف",
    nameEn: "Beef Stroganoff",
    descAr: "شرائح لحم فيليه طرية مطهوة بصوص الكريمة والمشروم البني، تقدم مع أرز أبيض.",
    descEn: "Tender beef fillet strips cooked in creamy brown mushroom sauce, served with white rice.",
    price: 265,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },

  // ================= 3. ساندوتشات وبرجر =================
  {
    id: "snd-1",
    category: "sandwiches",
    nameAr: "كلاسيك سماش برجر",
    nameEn: "Classic Smash Burger",
    descAr: "قطعة لحم بقري صافي 180 جم، جبنة شيدر أمريكي، خيار مخلل، بصل مكرمل، وصوص الكافيه الخاص.",
    descEn: "180g pure beef patty, American cheddar, pickles, caramelized onions & house special sauce.",
    price: 175,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    available: true,
    sizes: [
      { nameAr: "سنجل", nameEn: "Single", price: 175 },
      { nameAr: "دبل", nameEn: "Double", price: 235 }
    ],
    addons: [
      { nameAr: "بيف بيكون", nameEn: "Beef Bacon", price: 40 },
      { nameAr: "هالبينو", nameEn: "Jalapeño", price: 15 }
    ]
  },
  {
    id: "snd-2",
    category: "sandwiches",
    nameAr: "كلوب ساندوتش الكافيه",
    nameEn: "Signature Club Sandwich",
    descAr: "3 طبقات توست محمص مع دجاج مشوي، رومي مدخن، جبنة شيدر، بيض، خس، ويقدم مع بطاطس.",
    descEn: "Triple-decker toasted bread with grilled chicken, smoked turkey, cheddar, egg, lettuce & fries.",
    price: 160,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "snd-3",
    category: "sandwiches",
    nameAr: "تشيكن كرانشي راب",
    nameEn: "Crispy Chicken Wrap",
    descAr: "تورتيلا محمصة محشية صدور دجاج مقرمشة، خس، طماطم، وصوص رانش مدخن مع بطاطس.",
    descEn: "Toasted tortilla wrapped with crispy chicken tenders, lettuce, tomatoes & smoky ranch with fries.",
    price: 150,
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "صوص شيدر", nameEn: "Cheddar Sauce", price: 25 }]
  },
  {
    id: "snd-4",
    category: "sandwiches",
    nameAr: "تشيكن فاهيتا ساندوتش",
    nameEn: "Chicken Fajita Sub",
    descAr: "شرائح دجاج متبلة على الجريل مع فلفل ألوان، بصل مشوي، وجبنة موتزاريلا سايحة في عيش سياباتا.",
    descEn: "Grilled seasoned chicken strips with bell peppers, onions & melted mozzarella in ciabatta.",
    price: 165,
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },

  // ================= 4. قهوة ومشروبات ساخنة =================
  {
    id: "hot-1",
    category: "hot_coffee",
    nameAr: "سبانش لاتيه ساخن",
    nameEn: "Hot Spanish Latte",
    descAr: "شوت إسبريسو محمص بعناية مع حليب مبخر وحليب مكثف محلى لقوام كريمي غني.",
    descEn: "Carefully roasted espresso shot with steamed milk and sweetened condensed milk.",
    price: 75,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=80",
    available: true,
    badgeAr: "مفضل العملاء",
    badgeEn: "Popular",
    sizes: [
      { nameAr: "وسط", nameEn: "Regular", price: 75 },
      { nameAr: "كبير", nameEn: "Large", price: 90 }
    ],
    addons: [
      { nameAr: "إكسترا شوت إسبريسو", nameEn: "Extra Espresso Shot", price: 20 },
      { nameAr: "حليب لوز / شوفان", nameEn: "Almond / Oat Milk", price: 25 }
    ]
  },
  {
    id: "hot-2",
    category: "hot_coffee",
    nameAr: "قهوة تركي محوج",
    nameEn: "Spiced Turkish Coffee",
    descAr: "بن محمص وسط مع الحبهان المطحون، يُحضر على نار هادئة بوش تقيل.",
    descEn: "Medium-roasted finely ground coffee with cardamom, brewed slowly for rich crema.",
    price: 40,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    available: true,
    sizes: [
      { nameAr: "سنجل", nameEn: "Single", price: 40 },
      { nameAr: "دبل", nameEn: "Double", price: 55 }
    ],
    addons: []
  },
  {
    id: "hot-3",
    category: "hot_coffee",
    nameAr: "كابتشينو كلاسيك",
    nameEn: "Classic Cappuccino",
    descAr: "إسبريسو غني مع طبقة كثيفة من فوم الحليب المخملي ورشة كاكاو.",
    descEn: "Rich espresso topped with thick velvety steamed milk foam and cocoa dusting.",
    price: 65,
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    available: true,
    sizes: [
      { nameAr: "وسط", nameEn: "Regular", price: 65 },
      { nameAr: "كبير", nameEn: "Large", price: 80 }
    ],
    addons: [{ nameAr: "نكهة فانيليا / كراميل", nameEn: "Vanilla / Caramel Syrup", price: 15 }]
  },
  {
    id: "hot-4",
    category: "hot_coffee",
    nameAr: "فلات وايت",
    nameEn: "Flat White",
    descAr: "دبل شوت ريستريتو مع حليب مبخر ناعم لمحبي طعم القهوة المركز.",
    descEn: "Double ristretto shot poured with silky micro-foamed milk.",
    price: 70,
    image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "hot-5",
    category: "hot_coffee",
    nameAr: "هوت شوكليت بلجيكي",
    nameEn: "Belgian Hot Chocolate",
    descAr: "شوكولاتة بلجيكية داكنة مذابة في حليب طازج ساخن مع مارشميلو وكريمة مخفوقة.",
    descEn: "Melted Belgian dark chocolate in fresh hot milk topped with marshmallows & whipped cream.",
    price: 85,
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "إكسترا مارشميلو", nameEn: "Extra Marshmallows", price: 15 }]
  },
  {
    id: "hot-6",
    category: "hot_coffee",
    nameAr: "ماتشا لاتيه ساخن",
    nameEn: "Hot Ceremonial Matcha Latte",
    descAr: "بودرة ماتشا يابانية فاخرة مخفوقة مع حليب طازج مبخر.",
    descEn: "Premium Japanese ceremonial matcha whisked with warm steamed milk.",
    price: 85,
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "حليب شوفان", nameEn: "Oat Milk", price: 25 }]
  },

  // ================= 5. عصائر فريش وسموذي =================
  {
    id: "juc-1",
    category: "fresh_juice",
    nameAr: "مانجو عويسي بيور",
    nameEn: "Pure Owais Mango Juice",
    descAr: "عصير مانجو عويسي طبيعي 100% تقيل بدون أي إضافات أو ألوان صناعية.",
    descEn: "100% thick natural Owais mango juice with zero artificial additives.",
    price: 70,
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80",
    available: true,
    badgeAr: "فريش 100%",
    badgeEn: "100% Fresh",
    sizes: [
      { nameAr: "وسط", nameEn: "Regular", price: 70 },
      { nameAr: "كبير", nameEn: "Large", price: 85 }
    ],
    addons: [{ nameAr: "بولة آيس كريم فانيليا", nameEn: "Vanilla Ice Cream Scoop", price: 20 }]
  },
  {
    id: "juc-2",
    category: "fresh_juice",
    nameAr: "أفوكادو بالعسل والمكسرات",
    nameEn: "Avocado Honey & Nuts",
    descAr: "سموذي أفوكادو طازج محلى بعسل النحل الطبيعي ومغطى باللوز والكاجو المحمص.",
    descEn: "Fresh avocado smoothie sweetened with pure bee honey, topped with roasted almonds & cashews.",
    price: 105,
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "إكسترا مكسرات", nameEn: "Extra Nuts", price: 25 }]
  },
  {
    id: "juc-3",
    category: "fresh_juice",
    nameAr: "ليمون بالنعناع الفريش",
    nameEn: "Fresh Lemon Mint",
    descAr: "ليمون بلدي معصور طازج مع أوراق النعناع الأخضر والثلج المجروش.",
    descEn: "Freshly squeezed local limes blended with green mint leaves and crushed ice.",
    price: 55,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "juc-4",
    category: "fresh_juice",
    nameAr: "سموذي ميكس بيري",
    nameEn: "Mixed Berry Smoothie",
    descAr: "مزيج منعش من الفراولة والتوت الأزرق والأحمر المثلج مع زبادي طبيعي.",
    descEn: "Refreshing blend of frozen strawberries, blueberries & raspberries with natural yogurt.",
    price: 80,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "juc-5",
    category: "fresh_juice",
    nameAr: "فراولة فريش بالحليب",
    nameEn: "Fresh Strawberry Milkshake",
    descAr: "فراولة بلدي طازجة مخفوقة مع حليب مثلج وكريمة مخفوقة.",
    descEn: "Fresh local strawberries blended with chilled milk and whipped cream.",
    price: 65,
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "juc-6",
    category: "fresh_juice",
    nameAr: "كوكتيل فواكه الكافيه",
    nameEn: "House Signature Fruit Cocktail",
    descAr: "طبقات من عصير المانجو والفراولة والجوافة مع قطع فواكه طازجة وعسل.",
    descEn: "Layered mango, strawberry & guava juices with fresh diced fruits and honey.",
    price: 85,
    image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&q=80",
    available: true,
    badgeAr: "مميز",
    badgeEn: "Signature",
    sizes: [],
    addons: [{ nameAr: "قشطة وعسل", nameEn: "Cream & Honey", price: 20 }]
  },

  // ================= 6. آيس كوفي وموهيتو =================
  {
    id: "ice-1",
    category: "iced_drinks",
    nameAr: "آيس سبانش لاتيه",
    nameEn: "Iced Spanish Latte",
    descAr: "دبل شوت إسبريسو بارد مع حليب مثلج وحليب مكثف محلى ومكعبات ثلج.",
    descEn: "Double espresso shot poured over chilled milk, condensed milk & ice cubes.",
    price: 85,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
    available: true,
    badgeAr: "الأكثر مبيعاً",
    badgeEn: "Top Pick",
    sizes: [
      { nameAr: "وسط", nameEn: "Regular", price: 85 },
      { nameAr: "كبير", nameEn: "Large", price: 100 }
    ],
    addons: [{ nameAr: "صوص كراميل مملح", nameEn: "Salted Caramel Drizzle", price: 15 }]
  },
  {
    id: "ice-2",
    category: "iced_drinks",
    nameAr: "آيس كراميل ماكياتو",
    nameEn: "Iced Caramel Macchiato",
    descAr: "حليب مثلج بنكهة الفانيليا مع شوت إسبريسو وصوص كراميل غني.",
    descEn: "Chilled vanilla-flavored milk layered with espresso and rich caramel drizzle.",
    price: 85,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "ice-3",
    category: "iced_drinks",
    nameAr: "موهيتو باشن فروت",
    nameEn: "Passion Fruit Mojito",
    descAr: "بيوريه باشن فروت منعش مع شرائح ليمون، نعناع فريش، صودا، وثلج مجروش.",
    descEn: "Refreshing passion fruit puree with lime wedges, fresh mint, sparkling soda & crushed ice.",
    price: 80,
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "ice-4",
    category: "iced_drinks",
    nameAr: "فرابتشينو موكا",
    nameEn: "Mocha Frappuccino",
    descAr: "قهوة مثلجة مخفوقة مع صوص الشوكولاتة الداكنة والثلج ومغطاة بالكريمة.",
    descEn: "Blended iced coffee with dark chocolate sauce, crushed ice & whipped cream.",
    price: 90,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },

  // ================= 7. حلويات ووافل =================
  {
    id: "des-1",
    category: "desserts",
    nameAr: "وافل نوتيلا وموز",
    nameEn: "Nutella & Banana Waffle",
    descAr: "وافل بلجيكي مقرمش من بره وطري من جوه، مغطى بشوكولاتة نوتيلا، شرائح موز، وبندق.",
    descEn: "Crispy-outside fluffy-inside Belgian waffle topped with Nutella, fresh banana slices & hazelnuts.",
    price: 110,
    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "آيس كريم فانيليا", nameEn: "Vanilla Ice Cream", price: 20 }]
  },
  {
    id: "des-2",
    category: "desserts",
    nameAr: "تشيز كيك سان سيباستيان",
    nameEn: "San Sebastian Cheesecake",
    descAr: "تشيز كيك إسباني كريمي مخبوز يقدم دافئاً مع صوص شوكولاتة بلجيكية سايحة.",
    descEn: "Creamy Spanish burnt cheesecake served warm with melted Belgian chocolate pour-over.",
    price: 125,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80",
    available: true,
    badgeAr: "تريند",
    badgeEn: "Trending",
    sizes: [],
    addons: []
  },
  {
    id: "des-3",
    category: "desserts",
    nameAr: "مولتن كيك شوكولاتة",
    nameEn: "Chocolate Molten Lava Cake",
    descAr: "كيك شوكولاتة ساخن محشي شوكولاتة سايحة يقدم مع بولة آيس كريم فانيليا.",
    descEn: "Warm chocolate cake with a molten center served alongside a scoop of vanilla ice cream.",
    price: 115,
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "des-4",
    category: "desserts",
    nameAr: "تيراميسو إيطالي أصلي",
    nameEn: "Classic Italian Tiramisu",
    descAr: "طبقات بسكويت سافوياردي مشرب بالإسبريسو مع كريمة الماسكاربوني والكاكاو الفاخر.",
    descEn: "Espresso-soaked savoiardi biscuits layered with mascarpone cream and fine cocoa.",
    price: 105,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },

  // ================= 8. مياه وسلطات وإضافات =================
  {
    id: "ext-1",
    category: "extras",
    nameAr: "مياه معدنية كبيرة",
    nameEn: "Large Mineral Water",
    descAr: "زجاجة مياه معدنية طبيعية باردة 1.5 لتر.",
    descEn: "Chilled natural mineral water bottle 1.5L.",
    price: 20,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
    available: true,
    sizes: [
      { nameAr: "صغيرة", nameEn: "Small", price: 12 },
      { nameAr: "كبيرة", nameEn: "Large", price: 20 }
    ],
    addons: []
  },
  {
    id: "ext-2",
    category: "extras",
    nameAr: "سلطة سيزر بالدجاج",
    nameEn: "Chicken Caesar Salad",
    descAr: "خس كابوتشا طازج، قطع دجاج مشوي، خبز محمص، جبنة بارميزان، وصوص سيزر الأصلي.",
    descEn: "Crisp romaine lettuce, grilled chicken, croutons, parmesan & classic Caesar dressing.",
    price: 120,
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "ext-3",
    category: "extras",
    nameAr: "سلطة يونانية طازجة",
    nameEn: "Fresh Greek Salad",
    descAr: "خيار، طماطم شيري، فلفل ألوان، زيتون كلاماتا، جبنة فيتا، وزيت زيتون بكر.",
    descEn: "Cucumber, cherry tomatoes, bell peppers, Kalamata olives, feta cheese & olive oil.",
    price: 85,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
    available: true,
    sizes: [],
    addons: []
  },
  {
    id: "ext-4",
    category: "extras",
    nameAr: "بطاطس محمرة مقرمشة",
    nameEn: "Crispy French Fries",
    descAr: "طبق بطاطس ذهبية مقرمشة تقدم مع كاتشب ومايونيز.",
    descEn: "Golden crispy fries served with ketchup and mayonnaise.",
    price: 45,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
    available: true,
    sizes: [],
    addons: [{ nameAr: "صوص جبنة شيدر", nameEn: "Cheddar Sauce", price: 20 }]
  }
];