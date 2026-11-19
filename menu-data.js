export const CAFE_INFO = {
  nameAr: "روست آند بيري كافيه",
  nameEn: "Roast & Berry Cafe",
  taglineAr: "قهوة مختصة • فطار • سلطات • أطباق رئيسية • عصائر فريش وحلويات",
  addressAr: "شارع التسعين الشمالي، التجمع الخامس، القاهرة",
  hotline: "01018622861",
  whatsapp: "201018622861",
  wifiName: "RoastBerry_5G",
  wifiPass: "RB@2026#Cafe",
  currency: "ج.م",
  taxRate: 0.14
};

export const INITIAL_CATEGORIES = [
  { id: "breakfast", nameAr: "فطار الصباح", icon: "🍳" },
  { id: "mains", nameAr: "أطباق رئيسية وباستا", icon: "🍝" },
  { id: "burgers", nameAr: "ساندوتشات وبرجر", icon: "🍔" },
  { id: "salads", nameAr: "سلطات ومقبلات", icon: "🥗" },
  { id: "hot_coffee", nameAr: "قهوة ومشروبات ساخنة", icon: "☕" },
  { id: "iced_coffee", nameAr: "قهوة مثلجة وفرابيه", icon: "🧊" },
  { id: "fresh_juice", nameAr: "عصائر فريش وسموذي", icon: "🍹" },
  { id: "mojito", nameAr: "موهيتو ومشروبات غازية", icon: "🍋" },
  { id: "desserts", nameAr: "حلويات ووافل", icon: "🧇" }
];

export const INITIAL_MENU_ITEMS = [
  // 1. فطار الصباح (8 أصناف)
  { category: "breakfast", nameAr: "فطار مصري على أصوله", nameEn: "Egyptian Traditional Breakfast", descAr: "فول بالزيت الحار والطحينة، طعمية سخنة محشية جبنة بالطماطم، بيض أومليت وعيش بلدي طازة", price: 115, image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600", badge: "الأكثر طلباً" },
  { category: "breakfast", nameAr: "أومليت تركي ومشروم", nameEn: "Smoked Turkey & Mushroom Omelette", descAr: "3 بيضات مخفوقة مع شرائح رومي مدخن، مشروم فريش، جبنة شيدر سايحة وتوست محمص", price: 135, image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600" },
  { category: "breakfast", nameAr: "كرواسون زبدة فرنسي بالجبنة", nameEn: "French Cheese Croissant", descAr: "كرواسون مخبوز يومياً محشي ميكس جبن جودة وشيدر مع خس كابوتشا وطماطم شيري", price: 95, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600" },
  { category: "breakfast", nameAr: "بان كيك بالعسل والفواكه", nameEn: "Honey & Berries Pancake", descAr: "3 طبقات بان كيك هش يقدم مع عسل نحل طبيعي، فراولة طازجة وتوت بري", price: 110, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600" },
  { category: "breakfast", nameAr: "إنجليش بريكفاست كامل", nameEn: "Full English Breakfast", descAr: "بيض عيون، سوسيس بقري مشوي، مشروم سوتيه، فاصوليا حمراء وهاش براون مقرمش", price: 165, image: "https://images.unsplash.com/photo-1525351484163-7529414342d8?w=600" },
  { category: "breakfast", nameAr: "توست أفوكادو وبيض بوشيه", nameEn: "Avocado & Poached Egg Toast", descAr: "عيش ساوردو محمص مع مهروس الأفوكادو الطازج، بيض بوشيه ورشة سمسم محمص", price: 145, image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600" },
  { category: "breakfast", nameAr: "فرنش توست بالقرفة والكراميل", nameEn: "Cinnamon Caramel French Toast", descAr: "خبز بريوش سميك مغمس في الحليب والفانيليا مع صوص كراميل مملح وآيس كريم", price: 125, image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600" },
  { category: "breakfast", nameAr: "شاكشوكة بالجبنة الفيتا", nameEn: "Shakshuka with Feta Cheese", descAr: "بيض مطهو في صلصة طماطم طازجة بالفلفل الألوان والثوم مع جبنة فيتا وخبز ساخن", price: 105, image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600" },

  // 2. أطباق رئيسية وباستا (9 أصناف)
  { category: "mains", nameAr: "تشيكن ألفريدو باستا", nameEn: "Chicken Alfredo Pasta", descAr: "مكرونة فيتوتشيني بصوص الكريمة الغني، صدور دجاج مشوية، مشروم فريش وجبنة بارميزان", price: 195, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600", badge: "مميز" },
  { category: "mains", nameAr: "صدور دجاج مشوية بالروزماري", nameEn: "Rosemary Grilled Chicken", descAr: "قطعتين صدور دجاج متبلة بالأعشاب تقدم مع أرز بسمتي أبيض وخضار سوتيه", price: 210, image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600" },
  { category: "mains", nameAr: "بيني أرابياتا بالزيتون", nameEn: "Penne Arrabbiata", descAr: "مكرونة بيني بصوص الطماطم الإيطالي الحار، ثوم، ريحان فريش وزيتون أسود", price: 155, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600" },
  { category: "mains", nameAr: "بيف ستروجانوف", nameEn: "Beef Stroganoff", descAr: "شرائح لحم فيليه طرية مطهوة بصوص الكريمة والمشروم البني تقدم مع أرز أبيض", price: 265, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600" },
  { category: "mains", nameAr: "ستيك ريب آي مشوي", nameEn: "Grilled Ribeye Steak", descAr: "300 جم ستيك بقري مشوي على اللهب يقدم مع صوص الفلفل الأسود وبطاطس بيوريه", price: 340, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600", badge: "شيف" },
  { category: "mains", nameAr: "تشيكن كوردون بلو", nameEn: "Chicken Cordon Bleu", descAr: "صدور دجاج محشية رومي مدخن وجبنة شيدر مقلية ذهبية مع بطاطس ودجز", price: 220, image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600" },
  { category: "mains", nameAr: "سلمون مشوي بالليمون والشبت", nameEn: "Grilled Lemon Dill Salmon", descAr: "فيليه سلمون نرويجي مشوي مع صوص الزبدة والليمون وخضار مشوي", price: 320, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600" },
  { category: "mains", nameAr: "لازانيا لحم مفروم بالبشاميل", nameEn: "Classic Beef Lasagna", descAr: "طبقات لازانيا إيطالية باللحم المفروم المتبل، صوص البولونيز وموتزاريلا ذائبة", price: 190, image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600" },
  { category: "mains", nameAr: "ريزوتو مشروم وترافل", nameEn: "Truffle Mushroom Risotto", descAr: "أرز أربوريو إيطالي مطهو ببطء مع المشروم البري وزيت الترافل والبارميزان", price: 215, image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600" },

  // 3. ساندوتشات وبرجر (8 أصناف)
  { category: "burgers", nameAr: "كلاسيك سماش برجر", nameEn: "Classic Smash Burger", descAr: "قطعة لحم بقري صافي 180 جم، جبنة شيدر أمريكي، خيار مخلل، بصل مكرمل وصوص الكافيه الخاص", price: 175, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", badge: "الأكثر طلباً" },
  { category: "burgers", nameAr: "تشيكن كرانشي راب", nameEn: "Crispy Chicken Wrap", descAr: "تورتيلا محمصة محشية صدور دجاج مقرمشة، خس، طماطم وصوص رانش مدخن مع بطاطس", price: 150, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600" },
  { category: "burgers", nameAr: "كلوب ساندوتش الكافيه", nameEn: "Cafe Club Sandwich", descAr: "3 طبقات توست محمص مع دجاج مشوي، رومي مدخن، جبنة شيدر، بيض، خس ويقدم مع بطاطس", price: 160, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600" },
  { category: "burgers", nameAr: "تشيكن فاهيتا ساندوتش", nameEn: "Chicken Fajita Sandwich", descAr: "شرائح دجاج متبلة على الجريل مع فلفل ألوان، بصل مشوي وجبنة موتزاريلا سايحة في عيش سياباتا", price: 165, image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600" },
  { category: "burgers", nameAr: "مشروم سويس برجر", nameEn: "Mushroom Swiss Burger", descAr: "برجر لحم مشوي مغطى بصوص المشروم الكريمي وجبنة سويسرية ذائبة مع بطاطس محمرة", price: 195, image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600" },
  { category: "burgers", nameAr: "فيلي تشيز ستيك ساندوتش", nameEn: "Philly Cheesesteak", descAr: "شرائح لحم ستيك رفيعة مع بصل وفلفل مشوي وصوص جبنة شيدر ساخن في خبز فرنسي", price: 205, image: "https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=600" },
  { category: "burgers", nameAr: "كريسبي بافلو تشيكن برجر", nameEn: "Crispy Buffalo Chicken Burger", descAr: "صدر دجاج مقرمش مغمس في صوص البافلو الحار مع رانش وخس كابوتشا", price: 170, image: "https://images.unsplash.com/photo-1615297928064-24977384d0da?w=600" },
  { category: "burgers", nameAr: "حلوم مشوي بالبيستو", nameEn: "Grilled Halloumi Pesto", descAr: "جبنة حلوم مشوية مع صوص الريحان البيستو، طماطم مجففة وجرجير في خبز سياباتا", price: 145, image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=600" },

  // 4. سلطات ومقبلات (7 أصناف)
  { category: "salads", nameAr: "سلطة سيزر بالدجاج المشوي", nameEn: "Chicken Caesar Salad", descAr: "خس كابوتشا طازج، قطع دجاج مشوي، خبز محمص بالثوم، جبنة بارميزان وصوص سيزر", price: 140, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600" },
  { category: "salads", nameAr: "سلطة يونانية طازجة", nameEn: "Fresh Greek Salad", descAr: "طماطم، خيار، فلفل ألوان، بصل أحمر، زيتون كالاماتا وجبنة فيتا بزيت الزيتون البكر", price: 115, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600" },
  { category: "salads", nameAr: "ديناميت شرمب", nameEn: "Dynamite Shrimp", descAr: "جمبري مقرمش مغطى بصوص الديناميت الحار الحلو مع رشة بصل أخضر وسمسم", price: 195, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600", badge: "مقبلات" },
  { category: "salads", nameAr: "موتزاريلا ستيكس مقرمشة", nameEn: "Crispy Mozzarella Sticks", descAr: "6 أصابع جبنة موتزاريلا مقرمشة تقدم مع صوص المارينارا الإيطالي", price: 105, image: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600" },
  { category: "salads", nameAr: "بطاطس بالجبنة والهالبينو", nameEn: "Loaded Cheese Fries", descAr: "بطاطس محمرة مقرمشة مغطاة بصوص الشيدر الساخن، هالبينو وبيكون بقري", price: 95, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600" },
  { category: "salads", nameAr: "سلطة كينوا بالأفوكادو والرمان", nameEn: "Quinoa Avocado Salad", descAr: "حبوب الكينوا الصحية مع أفوكادو، حبات رمان طازجة، جرجير ودريسينج الليمون والعسل", price: 150, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600" },
  { category: "salads", nameAr: "أجنحة دجاج باربكيو", nameEn: "BBQ Chicken Wings", descAr: "8 قطع أجنحة دجاج مشوية ومغطاة بصوص الباربكيو المدخن مع صوص بلو تشيز", price: 135, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600" },

  // 5. قهوة ومشروبات ساخنة (10 أصناف)
  { category: "hot_coffee", nameAr: "سبانش لاتيه ساخن", nameEn: "Hot Spanish Latte", descAr: "شوت إسبريسو محمص بعناية مع حليب مبخر وحليب مكثف محلى لقوام كريمي غني", price: 75, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600", badge: "الأكثر طلباً" },
  { category: "hot_coffee", nameAr: "قهوة تركي محوج", nameEn: "Turkish Spiced Coffee", descAr: "بن محمص وسط مع الحبهان المطحون يُحضر على نار هادئة بوش تقيل", price: 40, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600" },
  { category: "hot_coffee", nameAr: "كابتشينو كلاسيك", nameEn: "Classic Cappuccino", descAr: "إسبريسو غني مع طبقة كثيفة من فوم الحليب المخملي ورشة كاكاو", price: 65, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600" },
  { category: "hot_coffee", nameAr: "فلات وايت", nameEn: "Flat White", descAr: "دبل شوت ريستريتو مع حليب مبخر ناعم لمحبي طعم القهوة المركز", price: 70, image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600" },
  { category: "hot_coffee", nameAr: "هوت شوكليت بلجيكي", nameEn: "Belgian Hot Chocolate", descAr: "شوكولاتة بلجيكية داكنة مذابة في حليب طازج ساخن مع مارشميلو وكريمة مخفوقة", price: 85, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600" },
  { category: "hot_coffee", nameAr: "ماتشا لاتيه ساخن", nameEn: "Hot Matcha Latte", descAr: "بودرة ماتشا يابانية فاخرة مخفوقة مع حليب طازج مبخر", price: 85, image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600" },
  { category: "hot_coffee", nameAr: "إسبريسو دبل شوت", nameEn: "Double Espresso", descAr: "استخلاص مركز من أجود حبوب الأرابيكا المحمصة طازجاً", price: 50, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600" },
  { category: "hot_coffee", nameAr: "كراميل ماكياتو ساخن", nameEn: "Hot Caramel Macchiato", descAr: "حليب مبخر بالفانيليا مع إسبريسو وخطوط صوص الكراميل الغني", price: 80, image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600" },
  { category: "hot_coffee", nameAr: "قهوة فرنسي بالبندق", nameEn: "French Hazelnut Coffee", descAr: "قهوة ناعمة مطبوخة بالحليب ونكهة البندق المحمص", price: 55, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600" },
  { category: "hot_coffee", nameAr: "شاي إنجليزي فاخر / أعشاب", nameEn: "Premium Tea & Herbs", descAr: "تشكيلة شاي إيرل جراي، نعناع طازج، ينسون أو كركديه دافئ", price: 35, image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600" },

  // 6. قهوة مثلجة وفرابيه (8 أصناف)
  { category: "iced_coffee", nameAr: "آيس سبانش لاتيه", nameEn: "Iced Spanish Latte", descAr: "إسبريسو مثلج مع الحليب البارد والحليب المكثف المحلى ومكعبات الثلج", price: 85, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600", badge: "منعش" },
  { category: "iced_coffee", nameAr: "آيس كراميل ماكياتو", nameEn: "Iced Caramel Macchiato", descAr: "طبقات الحليب البارد والإسبريسو مع صوص الكراميل والفانيليا", price: 85, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600" },
  { category: "iced_coffee", nameAr: "فرابيه موكا شوكولاتة", nameEn: "Mocha Chocolate Frappe", descAr: "قهوة مثلجة مخفوقة بالثلج وصوص الشوكولاتة الداكنة مع كريمة مخفوقة", price: 90, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600" },
  { category: "iced_coffee", nameAr: "آيس وايت موكا", nameEn: "Iced White Mocha", descAr: "إسبريسو مثلج ممزوج بصوص الشوكولاتة البيضاء والحليب البارد", price: 90, image: "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=600" },
  { category: "iced_coffee", nameAr: "فرابيه كراميل مملح", nameEn: "Salted Caramel Frappe", descAr: "مزيج مثلج كريمي بنكهة الكراميل المملح والقهوة المختصة", price: 95, image: "https://images.unsplash.com/photo-1579888944880-d98341245702?w=600" },
  { category: "iced_coffee", nameAr: "آيس أمريكانو", nameEn: "Iced Americano", descAr: "دبل شوت إسبريسو مصبوب فوق الماء المثلج لمذاق قهوة صافي ومنعش", price: 60, image: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=600" },
  { category: "iced_coffee", nameAr: "آيس ماتشا فانيليا", nameEn: "Iced Vanilla Matcha", descAr: "ماتشا يابانية مثلجة مع حليب بارد وسيرب الفانيليا الطبيعي", price: 95, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600" },
  { category: "iced_coffee", nameAr: "كولد برو نيترو", nameEn: "Cold Brew Coffee", descAr: "قهوة مختصة منقوعة على البارد لمدة 18 ساعة لنعومة وحلاوة طبيعية", price: 80, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600" },

  // 7. عصائر فريش وسموذي (8 أصناف)
  { category: "fresh_juice", nameAr: "مانجو عويسي بيور", nameEn: "Pure Alphonso Mango Juice", descAr: "عصير مانجو عويسي طبيعي 100% تقيل بدون أي إضافات أو ألوان صناعية", price: 70, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600", badge: "طبيعي" },
  { category: "fresh_juice", nameAr: "أفوكادو بالعسل والمكسرات", nameEn: "Avocado Honey & Nuts Smoothie", descAr: "سموذي أفوكادو طازج محلى بعسل النحل الطبيعي ومغطى باللوز والكاجو المحمص", price: 105, image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600" },
  { category: "fresh_juice", nameAr: "ليمون بالنعناع الفريش", nameEn: "Fresh Mint Lemonade", descAr: "ليمون بلدي معصور طازج مع أوراق النعناع الأخضر والثلج المجروش", price: 55, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600" },
  { category: "fresh_juice", nameAr: "سموذي ميكس بيري", nameEn: "Mixed Berry Smoothie", descAr: "مزيج منعش من الفراولة والتوت الأزرق والأحمر المثلج مع زبادي طبيعي", price: 80, image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600" },
  { category: "fresh_juice", nameAr: "فراولة فريش بالحليب", nameEn: "Fresh Strawberry Milkshake", descAr: "فراولة بلدي طازجة مخفوقة مع حليب مثلج وكريمة مخفوقة", price: 65, image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600" },
  { category: "fresh_juice", nameAr: "كوكتيل فواكه الكافيه", nameEn: "Cafe Signature Fruit Cocktail", descAr: "طبقات من عصير المانجو والفراولة والجوافة مع قطع فواكه طازجة وعسل", price: 85, image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600" },
  { category: "fresh_juice", nameAr: "عصير برتقال بلدي فريش", nameEn: "Fresh Orange Juice", descAr: "برتقال بلدي معصور طازج وقت الطلب غني بفيتامين سي", price: 55, image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600" },
  { category: "fresh_juice", nameAr: "ميلك شيك لوتس / أوريو", nameEn: "Lotus / Oreo Milkshake", descAr: "آيس كريم فانيليا مخفوق مع بسكويت اللوتس أو الأوريو وصوص الكراميل", price: 90, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600" },

  // 8. موهيتو ومشروبات غازية (7 أصناف)
  { category: "mojito", nameAr: "موهيتو كلاسيك ليمون ونعناع", nameEn: "Classic Lemon Mint Mojito", descAr: "شرائح ليمون طازج، أوراق نعناع، صودا مثلجة وسيرب الموهيتو المنعش", price: 65, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600" },
  { category: "mojito", nameAr: "موهيتو باشن فروت", nameEn: "Passion Fruit Mojito", descAr: "نكهة الباشن فروت الاستوائية مع الليمون والنعناع والصودا المثلجة", price: 75, image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600", badge: "منعش" },
  { category: "mojito", nameAr: "موهيتو بلو كوراساو", nameEn: "Blue Curacao Mojito", descAr: "لون أزرق ساحر بنكهة البرتقال الاستوائي والليمون والنعناع المثلج", price: 75, image: "https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600" },
  { category: "mojito", nameAr: "موهيتو فراولة وتوت أحمر", nameEn: "Strawberry Berry Mojito", descAr: "قطع فراولة طازجة مع سيرب التوت الأحمر والصودا والثلج", price: 75, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600" },
  { category: "mojito", nameAr: "آيس تي خوخ / ليمون", nameEn: "Peach / Lemon Iced Tea", descAr: "شاي مثلج منعش بنكهة الخوخ الطبيعي أو الليمون وشرائح الفاكهة", price: 60, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600" },
  { category: "mojito", nameAr: "مياه معدنية كبيرة", nameEn: "Large Mineral Water", descAr: "زجاجة مياه معدنية طبيعية باردة 1.5 لتر", price: 20, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600" },
  { category: "mojito", nameAr: "مشروب غازي (كانز)", nameEn: "Soft Drink Can", descAr: "بيبسي، سفن أب، ميرندا أو شويبس مثلج", price: 30, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600" },

  // 9. حلويات ووافل (9 أصناف)
  { category: "desserts", nameAr: "وافل نوتيلا وموز", nameEn: "Nutella & Banana Waffle", descAr: "وافل بلجيكي مقرمش من بره وطري من جوه مغطى بشوكولاتة نوتيلا، شرائح موز وبندق", price: 110, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600", badge: "الأكثر طلباً" },
  { category: "desserts", nameAr: "تشيز كيك سان سيباستيان", nameEn: "San Sebastian Cheesecake", descAr: "تشيز كيك إسباني كريمي مخبوز يقدم دافئاً مع صوص شوكولاتة بلجيكية سايحة", price: 125, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600", badge: "مميز" },
  { category: "desserts", nameAr: "مولتن كيك شوكولاتة", nameEn: "Chocolate Molten Cake", descAr: "كيك شوكولاتة ساخن محشي شوكولاتة سايحة يقدم مع بولة آيس كريم فانيليا", price: 115, image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600" },
  { category: "desserts", nameAr: "تيراميسو إيطالي أصلي", nameEn: "Authentic Italian Tiramisu", descAr: "طبقات بسكويت سافوياردي مشرب بالإسبريسو مع كريمة الماسكاربوني والكاكاو الفاخر", price: 105, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600" },
  { category: "desserts", nameAr: "وافل لوتس وكراميل", nameEn: "Lotus & Caramel Waffle", descAr: "وافل بلجيكي ساخن مغطى بسبريد اللوتس، بسكويت مطحون وصوص كراميل", price: 115, image: "https://images.unsplash.com/photo-1504387432042-8aca549e4729?w=600" },
  { category: "desserts", nameAr: "براونيز بالآيس كريم والمكسرات", nameEn: "Fudge Brownie Sundae", descAr: "قطعة براونيز شوكولاتة داكنة دافئة مع آيس كريم فانيليا وعين جمل وصوص فادج", price: 110, image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600" },
  { category: "desserts", nameAr: "كريب فيتوتشيني شوكولاتة", nameEn: "Fettuccine Crepe", descAr: "شرائح كريب رفيعة على شكل باستا مغطاة بالشوكولاتة البلجيكية البيضاء والداكنة", price: 120, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600" },
  { category: "desserts", nameAr: "ريد فيلفيت كيك", nameEn: "Red Velvet Cake", descAr: "طبقات كيك ريد فيلفيت المخملية مع كريمة الجبن الغنية", price: 100, image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600" },
  { category: "desserts", nameAr: "أم علي بالمكسرات والقشطة", nameEn: "Traditional Om Ali", descAr: "طاجن أم علي ساخن بالفرن مع الحليب، القشطة البلدي، الزبيب والمكسرات المحمصة", price: 90, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600" }
];

export const CATEGORIES = INITIAL_CATEGORIES;
export const MENU_ITEMS = INITIAL_MENU_ITEMS;
export const categories = INITIAL_CATEGORIES;
export const menuItems = INITIAL_MENU_ITEMS;

export default {
  CAFE_INFO,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  CATEGORIES,
  MENU_ITEMS
};