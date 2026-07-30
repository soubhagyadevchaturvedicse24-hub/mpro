import React from 'react';
import { HeartPulse, ShieldCheck, GitBranch, Share2, Link2, Mail, Phone, MapPin } from 'lucide-react';

const FooterLink = ({ children, href = '#' }) => (
  <a
    href={href}
    style={{ fontSize: '0.875rem', color: '#475569', textDecoration: 'none', lineHeight: '1.6', transition: 'color 0.2s' }}
    onMouseEnter={e => e.target.style.color = '#2563eb'}
    onMouseLeave={e => e.target.style.color = '#475569'}
  >
    {children}
  </a>
);

const HomeFooter = () => {
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)',
        borderTop: '1px solid rgba(96,165,250,0.2)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Main Footer Content */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 32px 24px' }}>

        {/* Top glow line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4), rgba(34,197,94,0.4), transparent)', borderRadius: '2px', marginBottom: '36px' }} />

        {/* 4-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '36px' }}>

          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #22d3a0, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HeartPulse size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', lineHeight: 1.1 }}>
                  Neo<span style={{ color: '#2563eb' }}>Life</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.05em' }}>OrganChain Network</div>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, maxWidth: '200px', margin: 0 }}>
              A blockchain-powered organ transplant ecosystem built for transparency, security and saving lives.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[GitBranch, Share2, Link2].map((Icon, i) => (
                <a key={i} href="#"
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(96,165,250,0.25)',
                    background: 'rgba(255,255,255,0.7)',
                    color: '#64748b',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#60a5fa'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.25)'; }}
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Quick Links</h4>
            {['Home', 'About', 'Contact', 'Whitepaper', 'Blog'].map(l => (
              <FooterLink key={l}>{l}</FooterLink>
            ))}
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Platform</h4>
            {['Donor Portal', 'Receiver Portal', 'Hospital Registry', 'Admin Dashboard', 'Blockchain Audit', 'Live Transport Map'].map(l => (
              <FooterLink key={l}>{l}</FooterLink>
            ))}
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Contact</h4>
            {[
              { Icon: Mail,   text: 'support@neolife.org' },
              { Icon: Phone,  text: '+91 98765 43210' },
              { Icon: MapPin, text: 'Raipur, Chhattisgarh, India' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Icon size={13} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
            {/* HIPAA badge */}
            <div style={{
              marginTop: '6px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(34,197,94,0.2)',
              background: 'rgba(240,253,244,0.8)',
            }}>
              <ShieldCheck size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', letterSpacing: '0.04em' }}>
                HIPAA Compliant · ISO 27001
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(96,165,250,0.15)', marginBottom: '20px' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
            © 2026 <span style={{ color: '#475569' }}>NeoLife OrganChain Network</span>. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#"
                style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#2563eb'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
