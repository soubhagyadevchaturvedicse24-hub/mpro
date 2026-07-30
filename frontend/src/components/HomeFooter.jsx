import React from 'react';
import { HeartPulse, ShieldCheck, GitBranch, Share2, Link2, Mail, Phone, MapPin } from 'lucide-react';

const FooterLink = ({ children, href = '#', isLight }) => (
  <a
    href={href}
    style={{ 
      fontSize: '0.875rem', 
      color: isLight ? '#6E6E73' : '#94a3b8', 
      textDecoration: 'none', 
      lineHeight: '1.6', 
      transition: 'color 0.2s' 
    }}
    onMouseEnter={e => e.target.style.color = isLight ? '#0066CC' : '#38bdf8'}
    onMouseLeave={e => e.target.style.color = isLight ? '#6E6E73' : '#94a3b8'}
  >
    {children}
  </a>
);

const HomeFooter = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <footer
      style={{
        background: isLight 
          ? 'linear-gradient(180deg, rgba(245, 245, 247, 0.92) 0%, #F5F5F7 100%)' 
          : 'linear-gradient(180deg, rgba(3, 7, 18, 0.94) 0%, #030712 100%)',
        borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'Inter, sans-serif',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Main Footer Content */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 32px 24px' }}>

        {/* Top glow line for dark mode */}
        {!isLight && (
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4), rgba(34,197,94,0.4), transparent)', borderRadius: '2px', marginBottom: '36px' }} />
        )}

        {/* 4-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '36px' }}>

          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', 
                background: isLight ? '#0066CC' : 'linear-gradient(135deg, #22d3a0, #60a5fa)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <HeartPulse size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isLight ? '#1D1D1F' : '#ffffff', lineHeight: 1.1 }}>
                  Neo<span style={{ color: isLight ? '#0066CC' : '#38bdf8' }}>Life</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: isLight ? '#6E6E73' : '#94a3b8', letterSpacing: '0.05em' }}>OrganChain Network</div>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: isLight ? '#6E6E73' : '#94a3b8', lineHeight: 1.6, maxWidth: '200px', margin: 0 }}>
              A blockchain-powered organ transplant ecosystem built for transparency, security and saving lives.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[GitBranch, Share2, Link2].map((Icon, i) => (
                <a key={i} href="#"
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                    background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
                    color: isLight ? '#6E6E73' : '#94a3b8',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.color = isLight ? '#0066CC' : '#38bdf8'; 
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0,102,204,0.3)' : 'rgba(56,189,248,0.3)'; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.color = isLight ? '#6E6E73' : '#94a3b8'; 
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'; 
                  }}
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#1D1D1F' : '#ffffff', margin: '0 0 4px 0' }}>Quick Links</h4>
            {['Home', 'About', 'Contact', 'Whitepaper', 'Blog'].map(l => (
              <FooterLink key={l} isLight={isLight}>{l}</FooterLink>
            ))}
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#1D1D1F' : '#ffffff', margin: '0 0 4px 0' }}>Platform</h4>
            {['Donor Portal', 'Receiver Portal', 'Hospital Registry', 'Admin Dashboard', 'Blockchain Audit', 'Live Transport Map'].map(l => (
              <FooterLink key={l} isLight={isLight}>{l}</FooterLink>
            ))}
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#1D1D1F' : '#ffffff', margin: '0 0 4px 0' }}>Contact</h4>
            {[
              { Icon: Mail,   text: 'support@neolife.org' },
              { Icon: Phone,  text: '+91 98765 43210' },
              { Icon: MapPin, text: 'Raipur, Chhattisgarh, India' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Icon size={13} style={{ color: isLight ? '#0066CC' : '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: isLight ? '#6E6E73' : '#94a3b8', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
            {/* HIPAA badge */}
            <div style={{
              marginTop: '6px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: isLight ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(34,197,94,0.3)',
              background: isLight ? 'rgba(240,253,244,0.8)' : 'rgba(34,197,94,0.1)',
            }}>
              <ShieldCheck size={13} style={{ color: isLight ? '#16a34a' : '#4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isLight ? '#15803d' : '#4ade80', letterSpacing: '0.04em' }}>
                HIPAA Compliant &bull; ISO 27001
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ 
          background: isLight ? '#EBEBEB' : 'rgba(255,255,255,0.03)', 
          borderRadius: '12px', 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}>
          <p style={{ fontSize: '0.8rem', color: isLight ? '#6E6E73' : '#64748b', margin: 0 }}>
            &copy; 2026 <span style={{ color: isLight ? '#1D1D1F' : '#cbd5e1' }}>NeoLife OrganChain Network</span>. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#"
                style={{ fontSize: '0.8rem', color: isLight ? '#6E6E73' : '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = isLight ? '#0066CC' : '#38bdf8'}
                onMouseLeave={e => e.target.style.color = isLight ? '#6E6E73' : '#64748b'}
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
