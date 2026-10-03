import React from 'react';
import { Globe, Instagram, MessageCircle, Linkedin, Facebook, Mail, ExternalLink, HelpCircle } from 'lucide-react';
import { extractCleanDomain } from '../utils/domain';

export default function DigitalPresenceBadge({ digitalPresence = {}, websiteUrl = null, onOpenDetails = null }) {
  const dp = digitalPresence || {};
  const web = dp.website || websiteUrl;
  const cleanWeb = extractCleanDomain(web);

  const hasAnyChannel = Boolean(web || dp.instagram?.url || dp.whatsapp?.url || dp.facebook?.url || dp.linkedin?.url || dp.email?.address);

  if (!hasAnyChannel) {
    return (
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Canais não pesquisados
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
          title={`Website: ${web}`}
        >
          <Globe size={11} />
          <span>{cleanWeb}</span>
        </a>
      )}

      {/* WhatsApp */}
      {dp.whatsapp?.url && (
        <a
          href={dp.whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge active-wa"
          title={`WhatsApp: ${dp.whatsapp.handle || dp.whatsapp.url}`}
        >
          <MessageCircle size={11} />
          <span>WhatsApp</span>
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
        >
          <Instagram size={11} />
          <span>{dp.instagram.handle || 'Instagram'}</span>
        </a>
      )}

      {/* LinkedIn */}
      {dp.linkedin?.url && (
        <a
          href={dp.linkedin.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-pill-badge"
          title={`LinkedIn: ${dp.linkedin.handle || dp.linkedin.url}`}
        >
          <Linkedin size={11} />
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
          title={`Facebook: ${dp.facebook.handle || dp.facebook.url}`}
        >
          <Facebook size={11} />
        </a>
      )}

      {/* Commercial Email */}
      {dp.email?.address && (
        <a
          href={`mailto:${dp.email.address}`}
          className="social-pill-badge"
          title={`E-mail: ${dp.email.address}`}
        >
          <Mail size={11} />
          <span>{dp.email.address}</span>
        </a>
      )}
    </div>
  );
}
