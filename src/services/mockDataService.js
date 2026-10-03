import { calculateDistance } from '../utils/distance';

/**
 * High fidelity mock data generator for Brazilian establishments (Dental, Gym, Pet, Restaurant, etc.)
 */
const mockEstablishmentTemplates = {
  odontologia: [
    { name: 'Dental Prime Tijuca', type: 'dentist', category: 'Clínica Odontológica', rating: 4.8, reviews: 264, phone: '(21) 3333-0000', web: 'dentalprime.com.br', price: '$$' },
    { name: 'Instituto Odontológico São Lucas', type: 'dentist', category: 'Clínica Odontológica', rating: 4.9, reviews: 412, phone: '(21) 2568-1234', web: 'saolucasodonto.com.br', price: '$$$' },
    { name: 'OrtoArte Ortodontia & Implantes', type: 'dental_clinic', category: 'Ortodontia Especializada', rating: 4.7, reviews: 189, phone: '(21) 3234-9988', web: 'ortoarte.com.br', price: '$$' },
    { name: 'Clínica Sorriso Carioca', type: 'dentist', category: 'Odontologia Estética', rating: 4.6, reviews: 98, phone: '(21) 2204-5566', web: 'sorrisocarioca.com.br', price: '$$' },
    { name: 'Dra. Camila Vasconcelos - Odonto', type: 'dentist', category: 'Consultório Odontológico', rating: 5.0, reviews: 73, phone: '(21) 98765-4321', web: 'dracamilavasconcelos.com.br', price: '$$$' },
    { name: 'OdontoCompany Tijuca Praça Saens Peña', type: 'dental_clinic', category: 'Clínica Geral & Implante', rating: 4.3, reviews: 520, phone: '(21) 3872-4000', web: 'odontocompany.com', price: '$' },
    { name: 'Centro Odontológico Conde Bonfim', type: 'dentist', category: 'Odontopediatria & Prótese', rating: 4.5, reviews: 142, phone: '(21) 2288-7711', web: 'odonto-condebonfim.med.br', price: '$$' },
    { name: 'Maxillo Facial Implantes', type: 'dental_clinic', category: 'Cirurgia & Traumatologia', rating: 4.9, reviews: 310, phone: '(21) 3456-7890', web: 'maxillofacial.com.br', price: '$$$$' },
    { name: 'OdontoMaster Tijuca', type: 'dentist', category: 'Clínica Odontológica', rating: 4.4, reviews: 85, phone: '(21) 2570-3322', web: null, price: '$$' },
    { name: 'Studio Oral Rio', type: 'dentist', category: 'Lentes de Contato Dental', rating: 4.9, reviews: 156, phone: '(21) 99123-4567', web: 'studiooralrio.com.br', price: '$$$' }
  ],
  academia: [
    { name: 'Smart Fit - Tijuca Saens Peña', type: 'gym', category: 'Academia', rating: 4.6, reviews: 1250, phone: '(21) 3500-1234', web: 'smartfit.com.br', price: '$' },
    { name: 'Bodytech Tijuca', type: 'gym', category: 'Academia Premium', rating: 4.8, reviews: 840, phone: '(21) 2567-9000', web: 'bodytech.com.br', price: '$$$$' },
    { name: 'Academia DNA Fitness', type: 'fitness_center', category: 'Musculação & Lutas', rating: 4.5, reviews: 310, phone: '(21) 2284-1100', web: 'dnafit.com.br', price: '$$' },
    { name: 'CrossFit Tijuca Black', type: 'gym', category: 'Centro de Treinamento CrossFit', rating: 4.9, reviews: 290, phone: '(21) 98877-6655', web: 'crossfittijuca.com.br', price: '$$$' },
    { name: 'Studio Pilates Vida & Postura', type: 'fitness_center', category: 'Studio de Pilates', rating: 5.0, reviews: 88, phone: '(21) 3211-4455', web: 'pilatesvidapostura.com.br', price: '$$$' },
    { name: 'Pratique Fitness Tijuca', type: 'gym', category: 'Academia Completa', rating: 4.4, reviews: 450, phone: '(21) 2571-0099', web: 'pratiquefitness.com.br', price: '$' }
  ],
  pet: [
    { name: 'Petz Tijuca Conde de Bonfim', type: 'pet_store', category: 'Pet Shop & Veterinária', rating: 4.7, reviews: 980, phone: '(21) 3434-2200', web: 'petz.com.br', price: '$$' },
    { name: 'Cobasi Tijuca Maracanã', type: 'pet_store', category: 'Mega Pet Shop', rating: 4.7, reviews: 1120, phone: '(21) 3838-5000', web: 'cobasi.com.br', price: '$$' },
    { name: 'Hospital Veterinário 24h VetCare', type: 'veterinary_care', category: 'Hospital Veterinário 24h', rating: 4.8, reviews: 630, phone: '(21) 2572-8899', web: 'vetcarerio.com.br', price: '$$$' },
    { name: 'Clínica Veterinária Bicho Mimado', type: 'veterinary_care', category: 'Banho, Tosa e Consultas', rating: 4.9, reviews: 175, phone: '(21) 2208-4433', web: 'bichomimadopet.com.br', price: '$$' },
    { name: 'Mundo Animal Pet Center', type: 'pet_store', category: 'Pet Shop & Acessórios', rating: 4.3, reviews: 95, phone: '(21) 2569-7700', web: null, price: '$' }
  ],
  restaurante: [
    { name: 'Restaurante Da Gema Tijuca', type: 'restaurant', category: 'Comida Brasileira & Petiscos', rating: 4.7, reviews: 1450, phone: '(21) 3576-2019', web: 'bardagema.com.br', price: '$$' },
    { name: 'Bão Culinária Mineira', type: 'restaurant', category: 'Restaurante Mineiro', rating: 4.8, reviews: 780, phone: '(21) 2568-8833', web: 'restaurantebeo.com.br', price: '$$' },
    { name: 'Churrascaria Galeto Mania', type: 'restaurant', category: 'Galeteria & Grelhados', rating: 4.4, reviews: 520, phone: '(21) 2234-5500', web: null, price: '$$' },
    { name: 'Mamma Jamma Pizzeria Tijuca', type: 'restaurant', category: 'Pizzaria Gourmet', rating: 4.7, reviews: 1680, phone: '(21) 3298-6000', web: 'mammajamma.com.br', price: '$$$' },
    { name: 'Sushi Tijuca Prime', type: 'restaurant', category: 'Culinária Japonesa', rating: 4.6, reviews: 490, phone: '(21) 3450-9000', web: 'sushitijucaprime.com.br', price: '$$$' }
  ],
  advogado: [
    { name: 'Oliveira & Associados Advocacia', type: 'lawyer', category: 'Direito Trabalhista e Cível', rating: 4.9, reviews: 112, phone: '(21) 2200-1122', web: 'oliveiraadvocacia.com.br', price: '$$$' },
    { name: 'Gomes & Ferreira Advogados', type: 'lawyer', category: 'Direito Previdenciário e Empresarial', rating: 4.8, reviews: 84, phone: '(21) 2569-4455', web: 'gomesferreira.adv.br', price: '$$$' },
    { name: 'Castro Consultoria Jurídica', type: 'lawyer', category: 'Direito Imobiliário', rating: 4.7, reviews: 45, phone: '(21) 3288-9900', web: 'castrojuridico.com.br', price: '$$$' }
  ],
  imobiliaria: [
    { name: 'Nova Época Imóveis Tijuca', type: 'real_estate_agency', category: 'Imobiliária & Locação', rating: 4.6, reviews: 340, phone: '(21) 3232-5000', web: 'novaepoca.com.br', price: '$$$' },
    { name: 'Lopes Rio - Tijuca Imóveis', type: 'real_estate_agency', category: 'Consultoria Imobiliária', rating: 4.5, reviews: 290, phone: '(21) 2112-7000', web: 'lopesrio.com.br', price: '$$$' },
    { name: 'Julio Bogoricin Imóveis', type: 'real_estate_agency', category: 'Vendas e Administração de Condomínios', rating: 4.3, reviews: 410, phone: '(21) 2566-8000', web: 'juliobogoricin.com', price: '$$$' }
  ],
  salao: [
    { name: 'Werner Coiffeur Tijuca Off Shopping', type: 'beauty_salon', category: 'Salão de Beleza & Estética', rating: 4.6, reviews: 520, phone: '(21) 2567-4500', web: 'werner.com.br', price: '$$$' },
    { name: 'Walter\'s Coiffeur Tijuca', type: 'beauty_salon', category: 'Cabeleireiros e Cuidados com Cabelo', rating: 4.5, reviews: 380, phone: '(21) 2284-6000', web: 'walterscoiffeur.com.br', price: '$$$' },
    { name: 'Espaço Beleza Pura Spa & Hair', type: 'spa', category: 'Centro Estético & Manicure', rating: 4.9, reviews: 140, phone: '(21) 99876-1122', web: 'belezapuraspa.com.br', price: '$$' }
  ]
};

const streetNames = [
  'Rua Conde de Bonfim',
  'Rua Haddock Lobo',
  'Rua São Francisco Xavier',
  'Rua Desembargador Izidro',
  'Avenida Maracanã',
  'Rua General Roca',
  'Rua Uruguai',
  'Rua Santo Afonso',
  'Rua Barão de Mesquita',
  'Praça Saens Peña',
  'Rua Bom Pastor',
  'Rua dos Artistas'
];

/**
 * Generate realistic places based on query, center coordinates, and radius
 */
export function generateMockPlaces(query = 'odontologia', centerLat = -22.9248, centerLng = -43.2326, radiusKm = 5, count = 24) {
  const queryLower = query.toLowerCase();
  
  let key = 'odontologia';
  if (queryLower.includes('acad') || queryLower.includes('fitness') || queryLower.includes('gym')) key = 'academia';
  else if (queryLower.includes('pet') || queryLower.includes('vet') || queryLower.includes('veterin')) key = 'pet';
  else if (queryLower.includes('restaur') || queryLower.includes('comida') || queryLower.includes('pizz') || queryLower.includes('bar')) key = 'restaurante';
  else if (queryLower.includes('advog') || queryLower.includes('jurid') || queryLower.includes('direito')) key = 'advogado';
  else if (queryLower.includes('imob') || queryLower.includes('corret') || queryLower.includes('imoveis')) key = 'imobiliaria';
  else if (queryLower.includes('salao') || queryLower.includes('cabel') || queryLower.includes('estet') || queryLower.includes('beleza')) key = 'salao';

  const baseList = mockEstablishmentTemplates[key] || mockEstablishmentTemplates.odontologia;
  const places = [];

  for (let i = 0; i < count; i++) {
    const base = baseList[i % baseList.length];
    const indexSuffix = i >= baseList.length ? ` - Unidade ${Math.floor(i / baseList.length) + 1}` : '';
    
    // Generate realistic coordinates within the radius
    // 1 deg lat ~ 111 km, 1 deg lon ~ 111 * cos(lat) km
    const angle = Math.random() * Math.PI * 2;
    const distanceFactor = Math.sqrt(Math.random()) * Math.min(radiusKm, 15); // distribute in circle
    const latOffset = (distanceFactor * Math.sin(angle)) / 111;
    const lngOffset = (distanceFactor * Math.cos(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));
    
    const itemLat = centerLat + latOffset;
    const itemLng = centerLng + lngOffset;
    const distanceKm = calculateDistance(centerLat, centerLng, itemLat, itemLng);
    
    const street = streetNames[i % streetNames.length];
    const streetNumber = 100 + ((i * 37) % 850);
    const formattedAddress = `${street}, ${streetNumber} - Rio de Janeiro, RJ`;

    const placeId = `mock_place_${key}_${i}_${Math.abs(Math.round(itemLat * 10000))}`;

    places.push({
      id: placeId,
      place_id: placeId,
      name: `${base.name}${indexSuffix}`,
      displayName: {
        text: `${base.name}${indexSuffix}`,
        languageCode: 'pt-BR'
      },
      formattedAddress,
      location: {
        latitude: itemLat,
        longitude: itemLng
      },
      lat: itemLat,
      lng: itemLng,
      primaryType: base.type,
      primaryTypeDisplayName: {
        text: base.category,
        languageCode: 'pt-BR'
      },
      category: base.category,
      nationalPhoneNumber: base.phone,
      internationalPhoneNumber: base.phone ? `+55 ${base.phone}` : null,
      websiteUri: base.web ? `https://www.${base.web}` : null,
      rating: parseFloat((base.rating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      userRatingCount: Math.max(12, Math.round(base.reviews * (0.7 + Math.random() * 0.6))),
      priceLevel: base.price,
      distanceKm: distanceKm,
      businessStatus: 'OPERATIONAL',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${base.name} ${formattedAddress}`)}`,
      currentOpeningHours: {
        openNow: Math.random() > 0.25,
        weekdayDescriptions: [
          'Segunda-feira: 08:00 – 19:00',
          'Terça-feira: 08:00 – 19:00',
          'Quarta-feira: 08:00 – 19:00',
          'Quinta-feira: 08:00 – 19:00',
          'Sexta-feira: 08:00 – 19:00',
          'Sábado: 08:00 – 14:00',
          'Domingo: Fechado'
        ]
      }
    });
  }

  return places;
}
