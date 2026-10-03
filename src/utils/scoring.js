/**
 * Explainable Lead Qualification & Prioritization Engine
 * Produces a 0-100 score with completely transparent, objective breakdown.
 */

export function calculateLeadScore(place, leadData = {}) {
  const factors = [];
  let score = 0;

  // Factor 1: Phone availability (+20 pts)
  const hasPhone = Boolean(place.nationalPhoneNumber || place.internationalPhoneNumber || place.phone);
  if (hasPhone) {
    score += 20;
    factors.push({
      key: 'phone',
      label: 'Contato Telefônico',
      points: 20,
      maxPoints: 20,
      status: 'positive',
      description: 'Telefone comercial direto disponível para abordagem.'
    });
  } else {
    factors.push({
      key: 'phone',
      label: 'Contato Telefônico',
      points: 0,
      maxPoints: 20,
      status: 'missing',
      description: 'Nenhum número de telefone listado.'
    });
  }

  // Factor 2: WhatsApp or Instant Messaging (+15 pts)
  const dp = place.digitalPresence || {};
  const hasWhatsApp = Boolean(dp.whatsapp?.url || dp.whatsapp?.handle);
  if (hasWhatsApp) {
    score += 15;
    factors.push({
      key: 'whatsapp',
      label: 'Canal WhatsApp',
      points: 15,
      maxPoints: 15,
      status: 'positive',
      description: 'Canal de mensagens instantâneas identificado.'
    });
  } else {
    factors.push({
      key: 'whatsapp',
      label: 'Canal WhatsApp',
      points: 0,
      maxPoints: 15,
      status: 'missing',
      description: 'WhatsApp direto não localizado nas fontes consultadas.'
    });
  }

  // Factor 3: Website & Digital Presence (+15 pts)
  const hasWebsite = Boolean(place.websiteUri || place.website);
  if (hasWebsite) {
    score += 15;
    factors.push({
      key: 'website',
      label: 'Website Institucional',
      points: 15,
      maxPoints: 15,
      status: 'positive',
      description: 'Domínio próprio verificado para análise de maturidade digital.'
    });
  } else {
    factors.push({
      key: 'website',
      label: 'Website Institucional',
      points: 0,
      maxPoints: 15,
      status: 'missing',
      description: 'Estabelecimento sem site próprio cadastrado.'
    });
  }

  // Factor 4: Social Media Presence (Instagram/Facebook/LinkedIn) (+15 pts)
  const hasSocial = Boolean(
    dp.instagram?.url || dp.instagram?.handle ||
    dp.facebook?.url || dp.facebook?.handle ||
    dp.linkedin?.url || dp.linkedin?.handle ||
    dp.tiktok?.url || dp.tiktok?.handle
  );
  if (hasSocial) {
    score += 15;
    factors.push({
      key: 'social',
      label: 'Rede Social Ativa',
      points: 15,
      maxPoints: 15,
      status: 'positive',
      description: 'Perfis de redes sociais (Instagram/LinkedIn/Facebook) mapeados.'
    });
  } else {
    factors.push({
      key: 'social',
      label: 'Rede Social Ativa',
      points: 0,
      maxPoints: 15,
      status: 'missing',
      description: 'Perfis sociais ainda não identificados.'
    });
  }

  // Factor 5: Social Proof & Reputation (+15 pts)
  const rating = place.rating || 0;
  const reviews = place.userRatingCount || 0;
  if (rating >= 4.2 && reviews >= 10) {
    score += 15;
    factors.push({
      key: 'reputation',
      label: 'Reputação Comercial',
      points: 15,
      maxPoints: 15,
      status: 'positive',
      description: `Excelente reputação: ★ ${rating} (${reviews} avaliações no Google).`
    });
  } else if (rating > 0) {
    score += 8;
    factors.push({
      key: 'reputation',
      label: 'Reputação Comercial',
      points: 8,
      maxPoints: 15,
      status: 'neutral',
      description: `Reputação moderada ou base pequena de reviews: ★ ${rating} (${reviews} avaliações).`
    });
  } else {
    factors.push({
      key: 'reputation',
      label: 'Reputação Comercial',
      points: 0,
      maxPoints: 15,
      status: 'missing',
      description: 'Sem avaliações públicas registradas.'
    });
  }

  // Factor 6: Proximity within radius (+10 pts)
  const dist = place.distanceKm;
  if (dist !== null && dist !== undefined && dist <= 3.0) {
    score += 10;
    factors.push({
      key: 'distance',
      label: 'Proximidade Estratégica',
      points: 10,
      maxPoints: 10,
      status: 'positive',
      description: `Localização privilegiada a ${dist.toFixed(1)} km do centro pesquisado.`
    });
  } else if (dist !== null && dist !== undefined && dist <= 8.0) {
    score += 5;
    factors.push({
      key: 'distance',
      label: 'Proximidade Estratégica',
      points: 5,
      maxPoints: 10,
      status: 'neutral',
      description: `Localização intermediária a ${dist.toFixed(1)} km.`
    });
  } else {
    factors.push({
      key: 'distance',
      label: 'Proximidade Estratégica',
      points: 0,
      maxPoints: 10,
      status: 'neutral',
      description: 'Distância superior ao raio imediato ou desconhecida.'
    });
  }

  // Factor 7: CRM Momentum & Next Action (+10 pts)
  const hasNextAction = Boolean(leadData.nextAction || leadData.returnDate);
  const isEngagedStatus = ['Contato realizado', 'Interessado', 'Cliente'].includes(leadData.status);

  if (hasNextAction || isEngagedStatus) {
    score += 10;
    factors.push({
      key: 'crm',
      label: 'Engajamento no Pipeline',
      points: 10,
      maxPoints: 10,
      status: 'positive',
      description: 'Lead com próxima ação agendada ou em avanço comercial.'
    });
  } else {
    factors.push({
      key: 'crm',
      label: 'Engajamento no Pipeline',
      points: 0,
      maxPoints: 10,
      status: 'missing',
      description: 'Lead ainda sem acompanhamento ou próxima ação agendada.'
    });
  }

  // Determine Tier
  let tier = 'Baixa';
  let tierColor = '#616963';
  let tierBg = '#EAECE8';

  if (score >= 75) {
    tier = 'Alta Prioridade';
    tierColor = '#173F35';
    tierBg = '#D6EC91';
  } else if (score >= 45) {
    tier = 'Média Prioridade';
    tierColor = '#9A4C1C';
    tierBg = '#FCECE7';
  }

  return {
    totalScore: Math.min(score, 100),
    tier,
    tierColor,
    tierBg,
    factors
  };
}
