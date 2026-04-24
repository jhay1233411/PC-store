import { Product, TutorialStep } from './types';

export const PRODUCTS: Product[] = [
  // --- INTEL CORE i SERIES ---
  {
    id: 'cpu-i3-10100',
    name: 'Intel Core i3-10100',
    category: 'CPU',
    price: 5600,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=800',
    description: '4 Cores, 8 Threads. A reliable budget choice for LGA 1200 office and light gaming builds.',
    stock: 10,
    socket: 'LGA1200',
    wattage: 65
  },
  {
    id: 'cpu-i3-12100',
    name: 'Intel Core i3-12100',
    category: 'CPU',
    price: 7280,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    description: '4 Cores, 8 Threads. The budget gaming king of the Alder Lake generation.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 60
  },
  {
    id: 'cpu-i5-11600k',
    name: 'Intel Core i5-11600K',
    category: 'CPU',
    price: 12880,
    image: 'https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800',
    description: '6 Cores, 12 Threads. High-performance mid-range CPU for the Rocket Lake platform.',
    stock: 10,
    socket: 'LGA1200',
    wattage: 125
  },
  {
    id: 'cpu-i5-13600k',
    name: 'Intel Core i5-13600K',
    category: 'CPU',
    price: 17920,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: '14 Cores (6P + 8E). Exceptional mid-range performance for gaming and productivity.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 125
  },
  {
    id: 'cpu-i7-12700k',
    name: 'Intel Core i7-12700K',
    category: 'CPU',
    price: 19600,
    image: 'https://images.unsplash.com/photo-1624701928517-44c8ac49d93c?auto=format&fit=crop&q=80&w=800',
    description: '12 Cores (8P + 4E). A powerful hybrid architecture chip for high-end gaming.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 125
  },
  {
    id: 'cpu-i7-14700k',
    name: 'Intel Core i7-14700K',
    category: 'CPU',
    price: 22960,
    image: 'https://images.unsplash.com/photo-1540655037529-dec987208707?auto=format&fit=crop&q=80&w=800',
    description: '20 Cores (8P + 12E). High-end performance with extra E-cores for multitasking.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 125
  },
  {
    id: 'cpu-i9-13900k',
    name: 'Intel Core i9-13900K',
    category: 'CPU',
    price: 31360,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    description: '24 Cores (8P + 16E). The previous generation flagship, still a beast for any task.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 253
  },
  {
    id: 'cpu-i9-14900ks',
    name: 'Intel Core i9-14900KS',
    category: 'CPU',
    price: 38640,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800',
    description: '24 Cores. The fastest 14th Gen chip, reaching up to 6.2 GHz out of the box.',
    stock: 10,
    socket: 'LGA1700',
    wattage: 150
  },

  // --- INTEL CORE ULTRA SERIES ---
  {
    id: 'cpu-ultra3-105',
    name: 'Intel Core Ultra 3 105',
    category: 'CPU',
    price: 8400,
    image: 'https://images.unsplash.com/photo-1580584126748-52ce7144e2b4?auto=format&fit=crop&q=80&w=800',
    description: 'Entry-level Arrow Lake efficiency. Perfect for modern office and media builds.',
    stock: 10,
    socket: 'LGA1851',
    wattage: 65
  },
  {
    id: 'cpu-ultra5-245k',
    name: 'Intel Core Ultra 5 245K',
    category: 'CPU',
    price: 17360,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    description: 'Arrow Lake architecture. 14 Cores. Next-gen efficiency and AI acceleration.',
    stock: 10,
    socket: 'LGA1851',
    wattage: 125
  },
  {
    id: 'cpu-ultra7-265k',
    name: 'Intel Core Ultra 7 265K',
    category: 'CPU',
    price: 22400,
    image: 'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&q=80&w=800',
    description: '20 Cores. Balanced high-end performance for the 2026 era.',
    stock: 10,
    socket: 'LGA1851',
    wattage: 125
  },
  {
    id: 'cpu-ultra9-285k',
    name: 'Intel Core Ultra 9 285K',
    category: 'CPU',
    price: 35280,
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800',
    description: '24 Cores. The flagship Arrow Lake processor with integrated NPU for AI tasks.',
    socket: 'LGA1851',
    wattage: 125
  },

  // --- AMD RYZEN SERIES ---
  {
    id: 'cpu-ryzen3-3300x',
    name: 'AMD Ryzen 3 3300X',
    category: 'CPU',
    price: 6720,
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    description: '4 Cores, 8 Threads. A legendary budget gaming CPU on the AM4 platform.'
  },
  {
    id: 'cpu-ryzen3-4100',
    name: 'AMD Ryzen 3 4100',
    category: 'CPU',
    price: 5040,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    description: '4 Cores, 8 Threads. Entry-level AM4 processor for basic computing and light gaming.'
  },
  {
    id: 'cpu-ryzen5-3600',
    name: 'AMD Ryzen 5 3600',
    category: 'CPU',
    price: 7280,
    image: 'https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800',
    description: '6 Cores, 12 Threads. The CPU that brought Ryzen to the mainstream.'
  },
  {
    id: 'cpu-ryzen5-5600',
    name: 'AMD Ryzen 5 5600',
    category: 'CPU',
    price: 8400,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: '6 Cores, 12 Threads. The legendary value king of the AM4 platform.',
    socket: 'AM4',
    wattage: 65
  },
  {
    id: 'cpu-ryzen5-9600x',
    name: 'AMD Ryzen 5 9600X',
    category: 'CPU',
    price: 15680,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    description: '6 Cores, 12 Threads. The 2026 value king of the AM5 platform using Zen 5 architecture.',
    socket: 'AM5',
    wattage: 65
  },
  {
    id: 'cpu-ryzen7-5700x',
    name: 'AMD Ryzen 7 5700X',
    category: 'CPU',
    price: 11200,
    image: 'https://images.unsplash.com/photo-1624701928517-44c8ac49d93c?auto=format&fit=crop&q=80&w=800',
    description: '8 Cores, 16 Threads. Efficient high-performance gaming and productivity CPU.',
    socket: 'AM4',
    wattage: 65
  },
  {
    id: 'cpu-ryzen7-7800x3d',
    name: 'AMD Ryzen 7 7800X3D',
    category: 'CPU',
    price: 25200,
    image: 'https://images.unsplash.com/photo-1540655037529-dec987208707?auto=format&fit=crop&q=80&w=800',
    description: '8 Cores with 3D V-Cache. Widely regarded as the best gaming CPU in the world.',
    socket: 'AM5',
    wattage: 120
  },
  {
    id: 'cpu-ryzen9-5900x',
    name: 'AMD Ryzen 9 5900X',
    category: 'CPU',
    price: 18480,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    description: '12 Cores, 24 Threads. A high-end AM4 powerhouse for creators.',
    socket: 'AM4',
    wattage: 105
  },
  {
    id: 'cpu-ryzen9-7950x',
    name: 'AMD Ryzen 9 7950X',
    category: 'CPU',
    price: 30800,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800',
    description: '16 Cores, 32 Threads. A productivity powerhouse for the AM5 platform.',
    socket: 'AM5',
    wattage: 170
  },
  {
    id: 'cpu-ryzen9-9950x3d',
    name: 'AMD Ryzen 9 9950X3D',
    category: 'CPU',
    price: 39200,
    image: 'https://images.unsplash.com/photo-1580584126748-52ce7144e2b4?auto=format&fit=crop&q=80&w=800',
    description: '16 Cores with 3D V-Cache. The 2026 flagship for extreme gaming and content creation.',
    socket: 'AM5',
    wattage: 170
  },

  // --- XEON & THREADRIPPER ---
  {
    id: 'cpu-xeon-w9-3495x',
    name: 'Intel Xeon w9-3495X',
    category: 'CPU',
    price: 329840,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    description: '56 Cores, 112 Threads. Sapphire Rapids workstation flagship for extreme multithreaded workloads.'
  },
  {
    id: 'cpu-threadripper-7980x',
    name: 'AMD Ryzen Threadripper 7980X',
    category: 'CPU',
    price: 279999,
    image: 'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&q=80&w=800',
    description: '64 Cores, 128 Threads. The ultimate HEDT processor for professional rendering and simulation.'
  },

  // --- OTHER COMPONENTS ---
  {
    id: 'gpu-rtx5090',
    name: 'NVIDIA GeForce RTX 5090',
    category: 'GPU',
    price: 111999,
    image: 'https://images.unsplash.com/photo-1591489378430-ef2f4c626b35?auto=format&fit=crop&q=80&w=800',
    description: 'Blackwell architecture. 32GB G6X memory. The 2026 performance leader.',
    wattage: 450
  },
  {
    id: 'gpu-rx8900',
    name: 'AMD Radeon RX 8900 XTX',
    category: 'GPU',
    price: 67199,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=800',
    description: 'RDNA 4 flagship. Exceptional value and performance for 4K/8K gaming.',
    wattage: 350
  },
  {
    id: 'ram-ddr5-8400',
    name: 'G.Skill Trident Z5 64GB DDR5-8400',
    category: 'RAM',
    price: 19599,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800',
    description: 'Ultra-fast DDR5 memory for high-end 2026 builds.',
    ramType: 'DDR5'
  },
  {
    id: 'ram-ddr4-3200-16',
    name: 'Corsair Vengeance LPX 16GB DDR4-3200',
    category: 'RAM',
    price: 2520,
    image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&q=80&w=800',
    description: 'Reliable high-performance DDR4 memory with 3200MHz speed. Perfect for AM4 and LGA 1200 builds.',
    ramType: 'DDR4'
  },
  {
    id: 'ram-ddr4-3600-32',
    name: 'G.Skill Ripjaws V 32GB DDR4-3600',
    category: 'RAM',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    description: 'High-capacity 32GB kit with 3600MHz clock speed for demanding multitasking and gaming.',
    ramType: 'DDR4'
  },
  {
    id: 'ram-ddr4-3200-rgb',
    name: 'T-Force Delta RGB 16GB DDR4-3200',
    category: 'RAM',
    price: 3080,
    image: 'https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800',
    description: 'Stylish RGB DDR4 memory with 3200MHz speed. Adds a vibrant touch to any gaming setup.',
    ramType: 'DDR4'
  },
  {
    id: 'mobo-z890',
    name: 'ASUS ROG Maximus Z890 Extreme',
    category: 'Motherboard',
    price: 55999,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: 'The ultimate Z890 board with PCIe 5.0 and AI features for Intel Core Ultra series.',
    socket: 'LGA1851',
    ramType: 'DDR5'
  },
  {
    id: 'mobo-b560m',
    name: 'MSI MAG B560M Bazooka',
    category: 'Motherboard',
    price: 6450,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800',
    description: 'Solid LGA 1200 motherboard for Intel 10th and 11th Gen processors. Great for budget builds.',
    socket: 'LGA1200',
    ramType: 'DDR4'
  },
  {
    id: 'mobo-z590',
    name: 'ASUS ROG Strix Z590-E Gaming WiFi',
    category: 'Motherboard',
    price: 14999,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    description: 'Premium LGA 1200 board with robust power delivery for high-end 11th Gen Intel CPUs.',
    socket: 'LGA1200',
    ramType: 'DDR4'
  },
  {
    id: 'mobo-b760',
    name: 'MSI MAG B760 Tomahawk WiFi',
    category: 'Motherboard',
    price: 11200,
    image: 'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&q=80&w=800',
    description: 'Versatile LGA 1700 motherboard supporting Intel 12th, 13th, and 14th Gen CPUs.',
    socket: 'LGA1700',
    ramType: 'DDR5'
  },
  {
    id: 'mobo-z790',
    name: 'ASUS ROG Strix Z790-E Gaming WiFi II',
    category: 'Motherboard',
    price: 27500,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: 'High-end LGA 1700 board with WiFi 7 and PCIe 5.0 support for 14th Gen Intel CPUs.',
    socket: 'LGA1700',
    ramType: 'DDR5'
  },
  {
    id: 'mobo-z890-carbon',
    name: 'MSI MPG Z890 Carbon WiFi',
    category: 'Motherboard',
    price: 34800,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    description: 'Next-gen LGA 1851 motherboard for Intel Core Ultra processors with advanced AI tuning.',
    socket: 'LGA1851',
    ramType: 'DDR5'
  },
  {
    id: 'mobo-b550',
    name: 'ASUS ROG Strix B550-F Gaming WiFi II',
    category: 'Motherboard',
    price: 10450,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800',
    description: 'The definitive AM4 motherboard for Ryzen 3000 and 5000 series processors.',
    socket: 'AM4',
    ramType: 'DDR4'
  },
  {
    id: 'mobo-b650',
    name: 'MSI MAG B650 Tomahawk WiFi',
    category: 'Motherboard',
    price: 13200,
    image: 'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&q=80&w=800',
    description: 'Excellent value AM5 motherboard for Ryzen 7000 and 9000 series CPUs.',
    socket: 'AM5',
    ramType: 'DDR5'
  },
  {
    id: 'mobo-x670e',
    name: 'ASUS ROG Strix X670E-E Gaming WiFi',
    category: 'Motherboard',
    price: 28900,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: 'Extreme AM5 performance with PCIe 5.0 for both GPU and M.2 storage.',
    socket: 'AM5',
    ramType: 'DDR5'
  },
  // --- PSUs ---
  {
    id: 'psu-850',
    name: 'Corsair RM850x 850W 80+ Gold',
    category: 'PSU',
    price: 8960,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=800',
    description: 'Reliable 850W power supply. Sufficient for RTX 4080/RTX 5080 builds.',
    wattage: 850
  },
  {
    id: 'psu-1200',
    name: 'ROG Thor 1200W Platinum II',
    category: 'PSU',
    price: 22400,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=800',
    description: 'Extreme 1200W PSU for power-hungry RTX 5090 and high-end workstation builds.',
    wattage: 1200
  }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    type: 'assemble',
    title: 'Complete PC Building Guide (2026)',
    content: 'Watch this comprehensive guide covering everything from unboxing components to the first boot. Learn the latest techniques for Arrow Lake and Zen 5 platforms.',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=800',
    videoUrl: '/lv_0_20260415204000.mp4'
  },
  {
    id: 4,
    type: 'disassemble',
    title: 'Safe Component Removal',
    content: 'Learn how to safely disassemble your PC for cleaning or upgrades. We cover proper ESD safety and delicate connector handling.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    videoUrl: '/lv_0_20260415205139.mp4'
  }
];
