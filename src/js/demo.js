// ===== Demo project =====
// A real landing page that loads on first open so the user sees something
// working immediately. Mirrors what the user would expect from a "Figma but
// for websites" tool.

export function demoProject() {
  return {
    name: 'Pagecraft Demo',
    sections: [
      // --- NAV ---
      {
        id: 'sec_demo_nav',
        type: 'section',
        tag: 'header',
        attrs: { class: 'nav' },
        styles: { padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        freeform: false,
        children: [
          { id: 'el_demo_logo', type: 'element', tag: 'div', text: 'Acme',
            styles: { fontSize: '20px', fontWeight: '700', color: '#111827' } },
          { id: 'el_demo_nav_links', type: 'element', tag: 'div',
            styles: { display: 'flex', gap: '24px' },
            children: [
              { id: 'el_demo_nav_1', type: 'element', tag: 'a', text: 'Features',
                attrs: { href: '#features' },
                styles: { color: '#4b5563', textDecoration: 'none', fontSize: '14px' } },
              { id: 'el_demo_nav_2', type: 'element', tag: 'a', text: 'Pricing',
                attrs: { href: '#pricing' },
                styles: { color: '#4b5563', textDecoration: 'none', fontSize: '14px' } },
              { id: 'el_demo_nav_3', type: 'element', tag: 'a', text: 'Sign in',
                attrs: { href: '#' },
                styles: { color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: '600' } }
            ]
          }
        ]
      },

      // --- HERO ---
      {
        id: 'sec_demo_hero',
        type: 'section',
        tag: 'section',
        attrs: { class: 'hero' },
        styles: { padding: '100px 40px', minHeight: '500px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff', textAlign: 'center' },
        freeform: false,
        children: [
          { id: 'el_demo_kicker', type: 'element', tag: 'p', text: 'NEW · Visual website builder',
            styles: { fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                      opacity: '0.85', margin: '0 0 16px 0' } },
          { id: 'el_demo_h1', type: 'element', tag: 'h1', text: 'Design your website, not just a mockup',
            styles: { fontSize: '56px', fontWeight: '800', margin: '0 0 16px 0',
                      lineHeight: '1.1', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' } },
          { id: 'el_demo_sub', type: 'element', tag: 'p',
            text: 'Drag, drop, and edit real HTML, CSS, and JavaScript. Export production-ready code in one click.',
            styles: { fontSize: '18px', margin: '0 0 32px 0', opacity: '0.9',
                      maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' } },
          { id: 'el_demo_cta_row', type: 'element', tag: 'div',
            styles: { display: 'flex', gap: '12px', justifyContent: 'center' },
            children: [
              { id: 'el_demo_cta_primary', type: 'element', tag: 'a', text: 'Get started free',
                attrs: { href: '#' },
                styles: { display: 'inline-block', padding: '14px 28px', background: '#ffffff',
                          color: '#6366f1', borderRadius: '8px', textDecoration: 'none',
                          fontWeight: '600', fontSize: '15px' } },
              { id: 'el_demo_cta_secondary', type: 'element', tag: 'a', text: 'Watch demo →',
                attrs: { href: '#' },
                styles: { display: 'inline-block', padding: '14px 24px',
                          color: '#ffffff', borderRadius: '8px', textDecoration: 'none',
                          fontWeight: '500', fontSize: '15px', border: '1px solid rgba(255,255,255,0.4)' } }
            ]
          }
        ]
      },

      // --- FEATURES ---
      {
        id: 'sec_demo_features',
        type: 'section',
        tag: 'section',
        attrs: { id: 'features', class: 'features' },
        styles: { padding: '80px 40px', background: '#f9fafb' },
        freeform: false,
        children: [
          { id: 'el_demo_features_title', type: 'element', tag: 'h2', text: 'Built for builders',
            styles: { fontSize: '36px', fontWeight: '700', margin: '0 0 12px 0',
                      textAlign: 'center', color: '#111827' } },
          { id: 'el_demo_features_sub', type: 'element', tag: 'p',
            text: 'Everything you need to ship a landing page in minutes.',
            styles: { fontSize: '16px', color: '#6b7280', margin: '0 0 48px 0',
                      textAlign: 'center' } },
          { id: 'el_demo_features_grid', type: 'element', tag: 'div',
            styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px',
                      maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' },
            children: [
              featureCard('demo_f1', '⚡', 'Lightning fast',
                'No build tools. No deploy waits. Edit, preview, export.'),
              featureCard('demo_f2', '🧩', 'Drag any block',
                'Hero sections, columns, forms — drop them anywhere on the page.'),
              featureCard('demo_f3', '📄', 'Your code',
                'Real HTML, CSS, and JavaScript files. No proprietary format.')
            ]
          }
        ]
      },

      // --- FREEFORM SHOWCASE (so user sees free-drag works) ---
      {
        id: 'sec_demo_freeform',
        type: 'section',
        tag: 'section',
        attrs: { class: 'showcase' },
        styles: { padding: '60px 40px', minHeight: '400px', background: '#0f172a',
                  color: '#ffffff', position: 'relative' },
        freeform: true,
        children: [
          { id: 'el_demo_ff_title', type: 'element', tag: 'h2', text: 'Place anything anywhere',
            styles: { position: 'absolute', left: '40px', top: '60px',
                      fontSize: '36px', fontWeight: '700', margin: '0', maxWidth: '420px' } },
          { id: 'el_demo_ff_sub', type: 'element', tag: 'p',
            text: 'This section is freeform — every child has its own X, Y position. Drag them.',
            styles: { position: 'absolute', left: '40px', top: '160px',
                      fontSize: '15px', margin: '0', opacity: '0.7', maxWidth: '380px' } },
          { id: 'el_demo_ff_card1', type: 'element', tag: 'div',
            text: '#1 Drag me',
            styles: { position: 'absolute', left: '560px', top: '60px',
                      padding: '20px 24px', background: '#6366f1', borderRadius: '12px',
                      fontWeight: '600', cursor: 'grab' } },
          { id: 'el_demo_ff_card2', type: 'element', tag: 'div',
            text: '#2 Drag me too',
            styles: { position: 'absolute', left: '700px', top: '180px',
                      padding: '20px 24px', background: '#8b5cf6', borderRadius: '12px',
                      fontWeight: '600', cursor: 'grab' } },
          { id: 'el_demo_ff_card3', type: 'element', tag: 'div',
            text: '#3 And resize this',
            styles: { position: 'absolute', left: '500px', top: '260px',
                      padding: '20px 24px', background: '#ec4899', borderRadius: '12px',
                      fontWeight: '600', cursor: 'grab', width: '180px' } }
        ]
      },

      // --- CTA ---
      {
        id: 'sec_demo_cta',
        type: 'section',
        tag: 'section',
        attrs: { class: 'cta' },
        styles: { padding: '80px 40px', background: '#ffffff', textAlign: 'center' },
        freeform: false,
        children: [
          { id: 'el_demo_cta_h', type: 'element', tag: 'h2', text: 'Ready to build?',
            styles: { fontSize: '36px', fontWeight: '700', margin: '0 0 12px 0', color: '#111827' } },
          { id: 'el_demo_cta_p', type: 'element', tag: 'p',
            text: 'Start with a template or import your existing site.',
            styles: { fontSize: '16px', color: '#6b7280', margin: '0 0 28px 0' } },
          { id: 'el_demo_cta_btn', type: 'element', tag: 'a', text: 'Start free',
            attrs: { href: '#' },
            styles: { display: 'inline-block', padding: '14px 32px', background: '#6366f1',
                      color: '#ffffff', borderRadius: '8px', textDecoration: 'none',
                      fontWeight: '600', fontSize: '15px' } }
        ]
      },

      // --- FOOTER ---
      {
        id: 'sec_demo_footer',
        type: 'section',
        tag: 'footer',
        attrs: { class: 'footer' },
        styles: { padding: '32px 40px', background: '#0f172a', color: '#94a3b8',
                  textAlign: 'center', fontSize: '13px' },
        freeform: false,
        children: [
          { id: 'el_demo_footer_p', type: 'element', tag: 'p',
            text: '© 2026 Acme. Built with Pagecraft.',
            styles: { margin: '0' } }
        ]
      }
    ],
    globalCSS: `/* Add custom CSS rules here.
   These are applied to your exported page in addition to inline styles. */

@media (max-width: 768px) {
  .hero h1 { font-size: 36px !important; }
  .features > div[style*="grid"] { grid-template-columns: 1fr !important; }
}
`,
    globalJS: `// JavaScript that runs on your exported page.
// Try the Preview tab to see this run.

console.log('Pagecraft demo loaded');
`,
    meta: { created: Date.now(), modified: Date.now() }
  };
}

function featureCard(id, icon, title, body) {
  return {
    id: 'el_' + id,
    type: 'element', tag: 'div',
    attrs: { class: 'feature-card' },
    styles: { padding: '28px', background: '#ffffff', borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    children: [
      { id: 'el_' + id + '_icon', type: 'element', tag: 'div', text: icon,
        styles: { fontSize: '32px', margin: '0 0 16px 0' } },
      { id: 'el_' + id + '_title', type: 'element', tag: 'h3', text: title,
        styles: { fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#111827' } },
      { id: 'el_' + id + '_body', type: 'element', tag: 'p', text: body,
        styles: { fontSize: '14px', color: '#6b7280', margin: '0', lineHeight: '1.6' } }
    ]
  };
}
