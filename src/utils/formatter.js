/**
 * Format brazilian phone numbers nicely
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.substring(2, 4);
    const num = cleaned.substring(4);
    return `+55 (${ddd}) ${num.length === 9 ? num.substring(0, 5) + '-' + num.substring(5) : num.substring(0, 4) + '-' + num.substring(4)}`;
  }
  return phone;
}

/**
 * Format date for history and saved lists
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Hoje ${timeStr}`;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem ${timeStr}`;
  }
  
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${timeStr}`;
}

/**
 * Get readable category name from Google Places type code
 */
export function getCategoryLabel(typeCode) {
  if (!typeCode) return 'Estabelecimento';
  
  const map = {
    dentist: 'Dentista / Odontologia',
    dental_clinic: 'Clínica Odontológica',
    doctor: 'Consultório Médico',
    hospital: 'Hospital',
    gym: 'Academia',
    fitness_center: 'Centro Fitness',
    pet_store: 'Pet Shop',
    veterinary_care: 'Clínica Veterinária',
    restaurant: 'Restaurante',
    lawyer: 'Advocacia / Jurídico',
    real_estate_agency: 'Imobiliária',
    beauty_salon: 'Salão de Beleza',
    hair_care: 'Cabeleireiro',
    spa: 'Spa & Estética',
    bakery: 'Padaria & Confeitaria',
    pharmacy: 'Farmácia',
    supermarket: 'Supermercado',
    car_repair: 'Oficina Mecânica',
    accounting: 'Contabilidade'
  };
  
  const lower = typeCode.toLowerCase().replace(/_/g, ' ');
  return map[typeCode] || lower.charAt(0).toUpperCase() + lower.slice(1);
}
