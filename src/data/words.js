// src/data/words.js
// Database kata untuk game Mister White
// Setiap kategori berisi array pasangan kata: { civilian, mrwhite, lang }

export const wordPairs = {
  hewan: [
    { civilian: 'Kucing', mrwhite: 'Anjing', lang: 'id' },
    { civilian: 'Singa', mrwhite: 'Harimau', lang: 'id' },
    { civilian: 'Lumba-lumba', mrwhite: 'Ikan Hiu', lang: 'id' },
    { civilian: 'Kelinci', mrwhite: 'Hamster', lang: 'id' },
    { civilian: 'Kuda', mrwhite: 'Zebra', lang: 'id' },
    { civilian: 'Burung Elang', mrwhite: 'Burung Hantu', lang: 'id' },
    { civilian: 'Gajah', mrwhite: 'Badak', lang: 'id' },
    { civilian: 'Cheetah', mrwhite: 'Macan Tutul', lang: 'id' },
    { civilian: 'Cat', mrwhite: 'Dog', lang: 'en' },
    { civilian: 'Lion', mrwhite: 'Tiger', lang: 'en' },
    { civilian: 'Dolphin', mrwhite: 'Shark', lang: 'en' },
    { civilian: 'Rabbit', mrwhite: 'Hamster', lang: 'en' },
  ],
  makanan: [
    { civilian: 'Pizza', mrwhite: 'Burger', lang: 'en' },
    { civilian: 'Sushi', mrwhite: 'Sashimi', lang: 'en' },
    { civilian: 'Nasi Goreng', mrwhite: 'Mie Goreng', lang: 'id' },
    { civilian: 'Rendang', mrwhite: 'Gulai', lang: 'id' },
    { civilian: 'Bakso', mrwhite: 'Soto', lang: 'id' },
    { civilian: 'Roti', mrwhite: 'Kue', lang: 'id' },
    { civilian: 'Ayam Goreng', mrwhite: 'Bebek Goreng', lang: 'id' },
    { civilian: 'Es Krim', mrwhite: 'Puding', lang: 'id' },
    { civilian: 'Pasta', mrwhite: 'Noodle', lang: 'en' },
    { civilian: 'Steak', mrwhite: 'BBQ Ribs', lang: 'en' },
    { civilian: 'Donut', mrwhite: 'Bagel', lang: 'en' },
    { civilian: 'Taco', mrwhite: 'Burrito', lang: 'en' },
  ],
  tempat: [
    { civilian: 'Pantai', mrwhite: 'Kolam Renang', lang: 'id' },
    { civilian: 'Gunung', mrwhite: 'Bukit', lang: 'id' },
    { civilian: 'Museum', mrwhite: 'Galeri Seni', lang: 'id' },
    { civilian: 'Bioskop', mrwhite: 'Teater', lang: 'id' },
    { civilian: 'Mall', mrwhite: 'Pasar', lang: 'id' },
    { civilian: 'Rumah Sakit', mrwhite: 'Klinik', lang: 'id' },
    { civilian: 'Sekolah', mrwhite: 'Universitas', lang: 'id' },
    { civilian: 'Bandara', mrwhite: 'Pelabuhan', lang: 'id' },
    { civilian: 'Beach', mrwhite: 'Swimming Pool', lang: 'en' },
    { civilian: 'Mountain', mrwhite: 'Hill', lang: 'en' },
    { civilian: 'Airport', mrwhite: 'Train Station', lang: 'en' },
    { civilian: 'Cinema', mrwhite: 'Theater', lang: 'en' },
  ],
  profesi: [
    { civilian: 'Dokter', mrwhite: 'Perawat', lang: 'id' },
    { civilian: 'Guru', mrwhite: 'Dosen', lang: 'id' },
    { civilian: 'Polisi', mrwhite: 'Tentara', lang: 'id' },
    { civilian: 'Chef', mrwhite: 'Koki', lang: 'id' },
    { civilian: 'Pilot', mrwhite: 'Pramugari', lang: 'id' },
    { civilian: 'Arsitek', mrwhite: 'Insinyur', lang: 'id' },
    { civilian: 'Hakim', mrwhite: 'Pengacara', lang: 'id' },
    { civilian: 'Fotografer', mrwhite: 'Videografer', lang: 'id' },
    { civilian: 'Doctor', mrwhite: 'Nurse', lang: 'en' },
    { civilian: 'Pilot', mrwhite: 'Flight Attendant', lang: 'en' },
    { civilian: 'Chef', mrwhite: 'Baker', lang: 'en' },
    { civilian: 'Judge', mrwhite: 'Lawyer', lang: 'en' },
  ],
  olahraga: [
    { civilian: 'Sepak Bola', mrwhite: 'Rugby', lang: 'id' },
    { civilian: 'Basket', mrwhite: 'Voli', lang: 'id' },
    { civilian: 'Tenis', mrwhite: 'Badminton', lang: 'id' },
    { civilian: 'Renang', mrwhite: 'Polo Air', lang: 'id' },
    { civilian: 'Tinju', mrwhite: 'MMA', lang: 'id' },
    { civilian: 'Bersepeda', mrwhite: 'Skateboard', lang: 'id' },
    { civilian: 'Football', mrwhite: 'Rugby', lang: 'en' },
    { civilian: 'Basketball', mrwhite: 'Volleyball', lang: 'en' },
    { civilian: 'Tennis', mrwhite: 'Badminton', lang: 'en' },
    { civilian: 'Swimming', mrwhite: 'Diving', lang: 'en' },
    { civilian: 'Boxing', mrwhite: 'MMA', lang: 'en' },
    { civilian: 'Cycling', mrwhite: 'Skateboarding', lang: 'en' },
  ],
  teknologi: [
    { civilian: 'Smartphone', mrwhite: 'Tablet', lang: 'en' },
    { civilian: 'Laptop', mrwhite: 'Desktop', lang: 'en' },
    { civilian: 'Headphone', mrwhite: 'Earphone', lang: 'en' },
    { civilian: 'Kamera', mrwhite: 'Drone', lang: 'id' },
    { civilian: 'Robot', mrwhite: 'AI', lang: 'en' },
    { civilian: 'Smart TV', mrwhite: 'Proyektor', lang: 'id' },
  ],
};

// Semua kategori
export const categories = Object.keys(wordPairs);

// Ambil kata random berdasarkan bahasa dan kategori
export const getRandomWord = (language = 'all', category = null) => {
  let allPairs = [];

  if (category && wordPairs[category]) {
    allPairs = wordPairs[category];
  } else {
    allPairs = Object.values(wordPairs).flat();
  }

  if (language !== 'all') {
    allPairs = allPairs.filter((p) => p.lang === language);
  }

  if (allPairs.length === 0) return { civilian: '???', mrwhite: '???' };

  return allPairs[Math.floor(Math.random() * allPairs.length)];
};
