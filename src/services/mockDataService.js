import { calculateDistance } from '../utils/distance';

/**
 * Dynamic realistic establishment generator for any Brazilian city/neighborhood
 */
const mockEstablishmentTemplates = {
  odontologia: [
    { prefix: 'Dental Prime', type: 'dentist', category: 'Clínica Odontológica', rating: 4.8, reviews: 264, phone: '3333-0000', webDomain: 'dentalprime.com.br', price: '$$' },
    { prefix: 'Instituto Odontológico São Lucas', type: 'dentist', category: 'Clínica Odontológica', rating: 4.9, reviews: 412, phone: '2568-1234', webDomain: 'saolucasodonto.com.br', price: '$$$' },
    { prefix: 'OrtoArte Ortodontia & Implantes', type: 'dental_clinic', category: 'Ortodontia Especializada', rating: 4.7, reviews: 189, phone: '3234-9988', webDomain: 'ortoarte.com.br', price: '$$' },
    { prefix: 'Clínica Sorriso & Saúde', type: 'dentist', category: 'Odontologia Estética', rating: 4.6, reviews: 98, phone: '2204-5566', webDomain: 'sorrisosaude.com.br', price: '$$' },
    { prefix: 'Dra. Camila Vasconcelos Odonto', type: 'dentist', category: 'Consultório Odontológico', rating: 5.0, reviews: 73, phone: '98765-4321', webDomain: 'dracamilavasconcelos.com.br', price: '$$$' },
    { prefix: 'OdontoCompany Centro', type: 'dental_clinic', category: 'Clínica Geral & Implante', rating: 4.3, reviews: 520, phone: '3872-4000', webDomain: 'odontocompany.com', price: '$' },
    { prefix: 'Centro Odontológico Especializado', type: 'dentist', category: 'Odontopediatria & Prótese', rating: 4.5, reviews: 142, phone: '2288-7711', webDomain: 'centrodonto.med.br', price: '$$' },
    { prefix: 'Maxillo Facial Implantes', type: 'dental_clinic', category: 'Cirurgia & Traumatologia', rating: 4.9, reviews: 310, phone: '3456-7890', webDomain: 'maxillofacial.com.br', price: '$$$$' },
    { prefix: 'OdontoMaster Clínica Integrada', type: 'dentist', category: 'Clínica Odontológica', rating: 4.4, reviews: 85, phone: '2570-3322', webDomain: null, price: '$$' },
    { prefix: 'Studio Oral Prime', type: 'dentist', category: 'Lentes de Contato Dental', rating: 4.9, reviews: 156, phone: '99123-4567', webDomain: 'studiooralprime.com.br', price: '$$$' }
  ],
  academia: [
    { prefix: 'Smart Fit', type: 'gym', category: 'Academia', rating: 4.6, reviews: 1250, phone: '3500-1234', webDomain: 'smartfit.com.br', price: '$' },
    { prefix: 'Bodytech Fitness', type: 'gym', category: 'Academia Premium', rating: 4.8, reviews: 840, phone: '2567-9000', webDomain: 'bodytech.com.br', price: '$$$$' },
    { prefix: 'Academia DNA Fitness', type: 'fitness_center', category: 'Musculação & Lutas', rating: 4.5, reviews: 310, phone: '2284-1100', webDomain: 'dnafit.com.br', price: '$$' },
    { prefix: 'CrossFit Black Box', type: 'gym', category: 'Centro de Treinamento CrossFit', rating: 4.9, reviews: 290, phone: '98877-6655', webDomain: 'crossfitblackbox.com.br', price: '$$$' },
    { prefix: 'Studio Pilates Vida & Postura', type: 'fitness_center', category: 'Studio de Pilates', rating: 5.0, reviews: 88, phone: '3211-4455', webDomain: 'pilatesvidapostura.com.br', price: '$$$' },
    { prefix: 'Pratique Fitness Total', type: 'gym', category: 'Academia Completa', rating: 4.4, reviews: 450, phone: '2571-0099', webDomain: 'pratiquefitness.com.br', price: '$' }
  ],
  pet: [
    { prefix: 'Petz Mega Store', type: 'pet_store', category: 'Pet Shop & Veterinária', rating: 4.7, reviews: 980, phone: '3434-2200', webDomain: 'petz.com.br', price: '$$' },
    { prefix: 'Cobasi Pet Center', type: 'pet_store', category: 'Mega Pet Shop', rating: 4.7, reviews: 1120, phone: '3838-5000', webDomain: 'cobasi.com.br', price: '$$' },
    { prefix: 'Hospital Veterinário 24h VetCare', type: 'veterinary_care', category: 'Hospital Veterinário 24h', rating: 4.8, reviews: 630, phone: '2572-8899', webDomain: 'vetcare24h.com.br', price: '$$$' },
    { prefix: 'Clínica Veterinária Bicho Mimado', type: 'veterinary_care', category: 'Banho, Tosa e Consultas', rating: 4.9, reviews: 175, phone: '2208-4433', webDomain: 'bichomimadopet.com.br', price: '$$' },
    { prefix: 'Mundo Animal Pet Center', type: 'pet_store', category: 'Pet Shop & Acessórios', rating: 4.3, reviews: 95, phone: '2569-7700', webDomain: null, price: '$' }
  ],
  restaurante: [
    { prefix: 'Restaurante Sabor da Terra', type: 'restaurant', category: 'Comida Brasileira & Grelhados', rating: 4.7, reviews: 1450, phone: '3576-2019', webDomain: 'sabordaterra.com.br', price: '$$' },
    { prefix: 'Cantina Bella Itália', type: 'restaurant', category: 'Pizzaria & Massas Artesanais', rating: 4.8, reviews: 780, phone: '2568-8833', webDomain: 'bellaitaliarestaurante.com.br', price: '$$' },
    { prefix: 'Churrascaria Gaúcha na Brasa', type: 'restaurant', category: 'Churrascaria & Rodízio', rating: 4.4, reviews: 520, phone: '2234-5500', webDomain: null, price: '$$' },
    { prefix: 'Sushi Prime Lounge', type: 'restaurant', category: 'Culinária Japonesa', rating: 4.7, reviews: 1680, phone: '3298-6000', webDomain: 'sushiprimelounge.com.br', price: '$$$' }
  ],
  advogado: [
    { prefix: 'Oliveira & Associados Advocacia', type: 'lawyer', category: 'Direito Trabalhista e Cível', rating: 4.9, reviews: 112, phone: '2200-1122', webDomain: 'oliveiraadvocacia.com.br', price: '$$$' },
    { prefix: 'Gomes & Ferreira Advogados', type: 'lawyer', category: 'Direito Previdenciário e Tributário', rating: 4.8, reviews: 84, phone: '2569-4455', webDomain: 'gomesferreira.adv.br', price: '$$$' },
    { prefix: 'Castro & Silva Consultoria Jurídica', type: 'lawyer', category: 'Direito Empresarial e Imobiliário', rating: 4.7, reviews: 45, phone: '3288-9900', webDomain: 'castrosilva.adv.br', price: '$$$' }
  ],
  imobiliaria: [
    { prefix: 'Nova Época Imóveis', type: 'real_estate_agency', category: 'Imobiliária & Locação', rating: 4.6, reviews: 340, phone: '3232-5000', webDomain: 'novaepocaimoveis.com.br', price: '$$$' },
    { prefix: 'Lopes Consultoria Imobiliária', type: 'real_estate_agency', category: 'Venda de Imóveis e Lançamentos', rating: 4.5, reviews: 290, phone: '2112-7000', webDomain: 'lopesconsultoria.com.br', price: '$$$' },
    { prefix: 'Habitar Imóveis & Condomínios', type: 'real_estate_agency', category: 'Administração Predial', rating: 4.3, reviews: 410, phone: '2566-8000', webDomain: 'habitarimoveis.com', price: '$$$' }
  ],
  salao: [
    { prefix: 'Studio de Beleza Bella Donna', type: 'beauty_salon', category: 'Salão de Beleza & Estética', rating: 4.6, reviews: 520, phone: '2567-4500', webDomain: 'belladonnastudio.com.br', price: '$$$' },
    { prefix: 'Espaço Elegance Cabelo e Make', type: 'beauty_salon', category: 'Cabeleireiros & Manicure', rating: 4.5, reviews: 380, phone: '2284-6000', webDomain: 'elegancehair.com.br', price: '$$$' },
    { prefix: 'Spa Urbano & Estética Facial', type: 'spa', category: 'Centro Estético & Massoterapia', rating: 4.9, reviews: 140, phone: '99876-1122', webDomain: 'spaurbanoestetica.com.br', price: '$$' }
  ]
};

const commonStreets = [
  'Avenida Principal',
  'Rua Presidente Vargas',
  'Avenida Brasil',
  'Rua Quinze de Novembro',
  'Rua Benjamin Pinto Dias',
  'Avenida Getúlio Vargas',
  'Rua Marechal Deodoro',
  'Rua Coronel França',
  'Avenida Central',
  'Rua da Matriz',
  'Rua Rui Barbosa',
  'Avenida Governador Leonel Brizola'
];

/**
 * Generate realistic places based on query, location name, center coordinates, and radius
 */
export function generateMockPlaces(
  query = 'odontologia',
  locationName = 'Belford Roxo',
  centerLat = -22.7639,
  centerLng = -43.3994,
  radiusKm = 5,
  count = 20
) {
  const queryLower = query.toLowerCase();
  
  let key = 'odontologia';
  if (queryLower.includes('acad') || queryLower.includes('fitness') || queryLower.includes('gym')) key = 'academia';
  else if (queryLower.includes('pet') || queryLower.includes('vet') || queryLower.includes('veterin')) key = 'pet';
  else if (queryLower.includes('restaur') || queryLower.includes('comida') || queryLower.includes('pizz') || queryLower.includes('bar')) key = 'restaurante';
  else if (queryLower.includes('advog') || queryLower.includes('jurid') || queryLower.includes('direito')) key = 'advogado';
  else if (queryLower.includes('imob') || queryLower.includes('corret') || queryLower.includes('imoveis')) key = 'imobiliaria';
  else if (queryLower.includes('salao') || queryLower.includes('cabel') || queryLower.includes('estet') || queryLower.includes('beleza')) key = 'salao';

  const baseList = mockEstablishmentTemplates[key] || mockEstablishmentTemplates.odontologia;
  
  // Clean location name to put in title (e.g. "Belford Roxo", "Tijuca")
  const shortLocName = locationName ? locationName.split(',')[0].trim() : 'Local';

  const places = [];

  for (let i = 0; i < count; i++) {
    const base = baseList[i % baseList.length];
    const unitSuffix = i >= baseList.length ? ` - Unidade ${Math.floor(i / baseList.length) + 1}` : '';
    
    // Distribute places naturally inside the search radius
    const angle = Math.random() * Math.PI * 2;
    const distanceFactor = Math.sqrt(Math.random()) * Math.min(radiusKm, 15);
    const latOffset = (distanceFactor * Math.sin(angle)) / 111;
    const lngOffset = (distanceFactor * Math.cos(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));
    
    const itemLat = centerLat + latOffset;
    const itemLng = centerLng + lngOffset;
    const distanceKm = calculateDistance(centerLat, centerLng, itemLat, itemLng);
    
    const street = commonStreets[i % commonStreets.length];
    const streetNumber = 50 + ((i * 47) % 950);
    const formattedAddress = `${street}, ${streetNumber} - ${locationName}`;

    const placeName = `${base.prefix} ${shortLocName}${unitSuffix}`;
    const placeId = `mock_${key}_${i}_${Math.abs(Math.round(itemLat * 10000))}`;
    const phone = base.phone ? `(21) ${base.phone}` : null;

    places.push({
      id: placeId,
      place_id: placeId,
      name: placeName,
      displayName: {
        text: placeName,
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
      nationalPhoneNumber: phone,
      internationalPhoneNumber: phone ? `+55 ${phone}` : null,
      websiteUri: base.webDomain ? `https://www.${base.webDomain}` : null,
      rating: parseFloat((base.rating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      userRatingCount: Math.max(14, Math.round(base.reviews * (0.7 + Math.random() * 0.6))),
      priceLevel: base.price,
      distanceKm: distanceKm,
      businessStatus: 'OPERATIONAL',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName} ${formattedAddress}`)}`,
      currentOpeningHours: {
        openNow: Math.random() > 0.2,
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
