// ===== Component Library =====
// Pre-built templates the user can drag onto the canvas.
// Each item: { id, name, desc, thumb, category, type, template }
// `template` is a node tree (without ids — generated on instantiate).

const sections = [
  {
    id: 'sec.blank',
    name: 'Blank Section',
    desc: 'Empty container to drop anything into',
    thumb: '▭',
    category: 'sections',
    type: 'section',
    template: {
      type: 'section',
      tag: 'section',
      attrs: { class: 'section' },
      styles: { padding: '80px 40px', minHeight: '300px', background: '#ffffff' },
      freeform: true,
      children: []
    }
  },
  {
    id: 'sec.hero',
    name: 'Hero',
    desc: 'Headline + subtext + CTA',
    thumb: '★',
    category: 'sections',
    type: 'section',
    template: {
      type: 'section',
      tag: 'section',
      attrs: { class: 'hero' },
      styles: {
        padding: '120px 40px',
        minHeight: '500px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#ffffff',
        textAlign: 'center'
      },
      freeform: false,
      children: [
        { type: 'element', tag: 'h1', text: 'Build websites without limits',
          styles: { fontSize: '56px', fontWeight: '800', margin: '0 0 16px 0', lineHeight: '1.1' } },
        { type: 'element', tag: 'p', text: 'A drag-and-drop builder that produces real HTML, CSS, and JavaScript.',
          styles: { fontSize: '20px', margin: '0 0 32px 0', opacity: '0.9', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' } },
        { type: 'element', tag: 'a', text: 'Get started',
          attrs: { href: '#' },
          styles: { display: 'inline-block', padding: '14px 32px', background: '#ffffff', color: '#6366f1',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '16px' } }
      ]
    }
  },
  {
    id: 'sec.features',
    name: 'Features (3 col)',
    desc: 'Three feature cards in a row',
    thumb: '▤',
    category: 'sections',
    type: 'section',
    template: {
      type: 'section',
      tag: 'section',
      attrs: { class: 'features' },
      styles: { padding: '80px 40px', background: '#f9fafb' },
      freeform: false,
      children: [
        { type: 'element', tag: 'h2', text: 'Why choose us',
          styles: { fontSize: '36px', fontWeight: '700', margin: '0 0 48px 0', textAlign: 'center', color: '#111827' } },
        { type: 'element', tag: 'div',
          attrs: { class: 'feature-grid' },
          styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            featureCard('Fast', 'Build and launch in minutes, not weeks.'),
            featureCard('Flexible', 'Drop any element anywhere on the page.'),
            featureCard('Yours', 'Export clean HTML, CSS, and JavaScript.')
          ]
        }
      ]
    }
  },
  {
    id: 'sec.cta',
    name: 'Call to Action',
    desc: 'Centered headline and button',
    thumb: '➤',
    category: 'sections',
    type: 'section',
    template: {
      type: 'section',
      tag: 'section',
      attrs: { class: 'cta' },
      styles: { padding: '100px 40px', background: '#111827', color: '#ffffff', textAlign: 'center' },
      freeform: false,
      children: [
        { type: 'element', tag: 'h2', text: 'Ready to get started?',
          styles: { fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0' } },
        { type: 'element', tag: 'p', text: 'Join thousands of teams shipping faster with Pagecraft.',
          styles: { fontSize: '18px', opacity: '0.8', margin: '0 0 32px 0' } },
        { type: 'element', tag: 'a', text: 'Start free',
          attrs: { href: '#' },
          styles: { display: 'inline-block', padding: '14px 36px', background: '#6366f1', color: '#fff',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: '600' } }
      ]
    }
  },
  {
    id: 'sec.footer',
    name: 'Footer',
    desc: 'Copyright + simple nav',
    thumb: '═',
    category: 'sections',
    type: 'section',
    template: {
      type: 'section',
      tag: 'footer',
      attrs: { class: 'footer' },
      styles: { padding: '40px', background: '#0f172a', color: '#9ca3af', textAlign: 'center', fontSize: '13px' },
      freeform: false,
      children: [
        { type: 'element', tag: 'p', text: '© 2026 Your Company. All rights reserved.',
          styles: { margin: '0' } }
      ]
    }
  }
];

function featureCard(title, body) {
  return {
    type: 'element', tag: 'div',
    attrs: { class: 'feature-card' },
    styles: { padding: '28px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    children: [
      { type: 'element', tag: 'h3', text: title,
        styles: { fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0', color: '#111827' } },
      { type: 'element', tag: 'p', text: body,
        styles: { margin: '0', color: '#4b5563', lineHeight: '1.6' } }
    ]
  };
}

const elements = [
  {
    id: 'el.heading',
    name: 'Heading',
    desc: 'h2 title',
    thumb: 'H',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'h2', text: 'Heading',
      styles: { fontSize: '32px', fontWeight: '700', margin: '0', color: '#111827' }
    }
  },
  {
    id: 'el.paragraph',
    name: 'Paragraph',
    desc: 'Body text',
    thumb: '¶',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'p', text: 'A paragraph of body text. Click to edit.',
      styles: { fontSize: '16px', margin: '0', color: '#374151', lineHeight: '1.6' }
    }
  },
  {
    id: 'el.button',
    name: 'Button',
    desc: 'Clickable link button',
    thumb: '▢',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'a', text: 'Click me',
      attrs: { href: '#' },
      styles: { display: 'inline-block', padding: '10px 22px', background: '#6366f1', color: '#fff',
                borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }
    }
  },
  {
    id: 'el.image',
    name: 'Image',
    desc: 'Photo placeholder',
    thumb: '🖼',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'img',
      attrs: { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Image', alt: 'Image' },
      styles: { maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '8px' }
    }
  },
  {
    id: 'el.container',
    name: 'Box',
    desc: 'Generic container',
    thumb: '□',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'div',
      styles: { padding: '24px', minHeight: '80px', background: '#f3f4f6', borderRadius: '8px' },
      children: []
    }
  },
  {
    id: 'el.spacer',
    name: 'Spacer',
    desc: 'Vertical space',
    thumb: '↕',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'div',
      styles: { height: '40px' }
    }
  },
  {
    id: 'el.input',
    name: 'Text Input',
    desc: 'Form field',
    thumb: '▭',
    category: 'elements',
    type: 'element',
    template: {
      type: 'element', tag: 'input',
      attrs: { type: 'text', placeholder: 'Enter text' },
      styles: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', width: '240px' }
    }
  }
];

const layouts = [
  {
    id: 'lay.2col',
    name: '2 Columns',
    desc: 'Two equal columns',
    thumb: '▥',
    category: 'layouts',
    type: 'element',
    template: {
      type: 'element', tag: 'div',
      attrs: { class: 'cols-2' },
      styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' },
      children: [
        { type: 'element', tag: 'div', styles: { padding: '20px', background: '#f3f4f6', borderRadius: '6px', minHeight: '100px' }, children: [] },
        { type: 'element', tag: 'div', styles: { padding: '20px', background: '#f3f4f6', borderRadius: '6px', minHeight: '100px' }, children: [] }
      ]
    }
  },
  {
    id: 'lay.3col',
    name: '3 Columns',
    desc: 'Three equal columns',
    thumb: '▦',
    category: 'layouts',
    type: 'element',
    template: {
      type: 'element', tag: 'div',
      attrs: { class: 'cols-3' },
      styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%' },
      children: [
        { type: 'element', tag: 'div', styles: { padding: '20px', background: '#f3f4f6', borderRadius: '6px', minHeight: '100px' }, children: [] },
        { type: 'element', tag: 'div', styles: { padding: '20px', background: '#f3f4f6', borderRadius: '6px', minHeight: '100px' }, children: [] },
        { type: 'element', tag: 'div', styles: { padding: '20px', background: '#f3f4f6', borderRadius: '6px', minHeight: '100px' }, children: [] }
      ]
    }
  },
  {
    id: 'lay.row',
    name: 'Row (flex)',
    desc: 'Horizontal flex row',
    thumb: '⫶',
    category: 'layouts',
    type: 'element',
    template: {
      type: 'element', tag: 'div',
      attrs: { class: 'row-flex' },
      styles: { display: 'flex', gap: '16px', alignItems: 'center', width: '100%' },
      children: []
    }
  }
];

export const ALL_TEMPLATES = [...sections, ...elements, ...layouts];

export function templatesByCategory(category) {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

export function templateById(id) {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function searchTemplates(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_TEMPLATES;
  return ALL_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q)
  );
}
