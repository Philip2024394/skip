import type { Profile } from "@/types/profile";

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop",
];

const CITIES = ["Jakarta", "Bali", "Bandung", "Surabaya", "Yogyakarta"];

export const generateMockProfiles = (count: number = 20): Profile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `profile-${i}`,
    name: `Profile ${i + 1}`,
    age: 20 + (i % 15),
    city: CITIES[i % CITIES.length],
    country: "Indonesia",
    bio: "Mock profile for development use.",
    image: MOCK_IMAGES[i % MOCK_IMAGES.length],
    images: [MOCK_IMAGES[i % MOCK_IMAGES.length]],
    gender: i % 2 === 0 ? "Female" : "Male",
  }));
