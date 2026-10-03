import React from 'react';
import { Globe, Instagram, MessageCircle, Linkedin, Facebook, Mail, Check } from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';

export default function DigitalPresenceBadge({ digitalPresence = {}, websiteUrl = null, onOpenDetails = null }) {
  const dp = digitalPresence || {};
  const web = dp.website || websiteUrl;
  const cleanWeb = extractCleanDomain(web);

  const hasAnyChannel = Boolean(web || dp.instagram?.url || dp.whatsapp?.url || dp.facebook?.url || dp.linkedin?.url || dp.email?.address);

  if (!hasAnyChannel) {
    return (
      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
        Canais não identificados
      </span>
    );
  }

  return (
    <div className="digital-presence-strip" onClick={(e) => e.stopPropagation()}>
      {/* Website */}
      {web && (
        <a
          href={web}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge active-web"
          title={`Website Institucional: ${web}`}
          aria-label="Abrir website institucional"
        >
          <Globe size={12} />
          <span>{cleanWeb || 'Website'}</span>
        </a>
      )}

      {/* WhatsApp */}
      {dp.whatsapp?.url && (
        <a
          href={dp.whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge active-wa"
          title={`WhatsApp: ${dp.whatsapp.handle || 'Conversar no WhatsApp'}`}
          aria-label="Abrir conversa no WhatsApp"
        >
          <MessageCircle size={12} />
          <span>WhatsApp</span>
          {dp.whatsapp.status === 'Confirmado pelo usuário' && <Check size={10} />}
        </a>
      )}

      {/* Instagram */}
      {dp.instagram?.url && (
        <a
          href={dp.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge active-ig"
          title={`Instagram: ${dp.instagram.handle || dp.instagram.url}`}
          aria-label="Abrir perfil no Instagram"
        >
          <Instagram size={12} />
          <span>{dp.instagram.handle || 'Instagram'}</span>
          {dp.instagram.status === 'Confirmado pelo usuário' && <Check size={10} />}
        </a>
      )}

      {/* LinkedIn */}
      {dp.linkedin?.url && (
        <a
          href={dp.linkedin.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge active-li"
          title={`LinkedIn: ${dp.linkedin.handle || 'Perfil Corporativo'}`}
          aria-label="Abrir LinkedIn"
        >
          <Linkedin size={12} />
          <span>LinkedIn</span>
        </a>
      )}

      {/* Facebook */}
      {dp.facebook?.url && (
        <a
          href={dp.facebook.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge"
          title={`Facebook: ${dp.facebook.handle || 'Página do Facebook'}`}
          aria-label="Abrir Facebook"
        >
          <Facebook size={12} color="#1877F2" />
        </a>
      )}

      {/* Commercial Email */}
      {dp.email?.address && (
        <a
          href={`mailto:${dp.email.address}`}
          className="social-pill-badge"
          title={`E-mail: ${dp.email.address}`}
          aria-label={`Enviar e-mail para ${dp.email.address}`}
        >
          <Mail size={12} />
          <span>{dp.email.address}</span>
        </a>
      )}
    </div>
  );
}
