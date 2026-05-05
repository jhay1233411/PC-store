export type UserRole = 'customer' | 'admin' | 'owner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Motherboard' | 'PSU' | 'Case' | 'Cooling' | 'Monitor' | 'Mouse' | 'Keyboard' | 'Headset' | 'Peripherals' | 'Pre-Built';
  price: number;
  image: string;
  description: string;
  stock?: number;
  // Compatibility Fields
  socket?: string; // e.g., 'AM4', 'LGA1700'
  ramType?: 'DDR4' | 'DDR5';
  wattage?: number; // PSU output or Component draw
  capacity?: string; // e.g., '500GB', '1TB', '2TB'
  isHighlyRecommended?: boolean;
}

export interface PCBuild {
  id: string;
  userId: string;
  name: string;
  components: {
    [key in Product['category']]?: Product;
  };
  totalPrice: number;
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zipCode: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: Product[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentMethod: 'gcash' | 'paymaya' | 'visa' | 'bank_transfer';
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Target user (owner/admin)
  message: string;
  type: 'order' | 'system';
  read: boolean;
  createdAt: string;
}

export interface TutorialStep {
  id: number;
  title: string;
  content: string;
  image: string;
  videoUrl?: string;
  type: 'assemble' | 'disassemble';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FlashSale {
  id: string;
  message: string;
  isActive: boolean;
  productIds?: string[]; // IDs of products on sale
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20%)
  expiresAt?: string;
  createdAt: string;
}

export interface PreBuiltPC {
  id: string;
  name: string;
  tier: 'Entry' | 'Mid' | 'High' | 'Extreme';
  price: number;
  image: string;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    cooling?: string;
    monitor?: string;
    peripherals?: string;
    peripherals_2?: string;
    peripherals_3?: string;
  };
  features: string[];
  createdAt: string;
}

export interface AIMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}
