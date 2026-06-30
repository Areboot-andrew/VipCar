---
name: First Line Transfer
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1b1b1c'
  surface-container: '#1f1f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353536'
  on-surface: '#e4e2e3'
  on-surface-variant: '#c7c6ca'
  inverse-surface: '#e4e2e3'
  inverse-on-surface: '#303031'
  outline: '#909094'
  outline-variant: '#46474a'
  surface-tint: '#c8c6c7'
  primary: '#c8c6c7'
  on-primary: '#303031'
  primary-container: '#1a1a1b'
  on-primary-container: '#848283'
  inverse-primary: '#5f5e5f'
  secondary: '#e9c349'
  on-secondary: '#3c2f00'
  secondary-container: '#af8d11'
  on-secondary-container: '#342800'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#191b1b'
  on-tertiary-container: '#828383'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1b1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131314'
  on-background: '#e4e2e3'
  surface-variant: '#353536'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
  button:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
  stack-lg: 80px
  stack-md: 48px
---

## Brand & Style

The design system embodies the pinnacle of executive travel, focusing on the concepts of "The First Class of the Road." The brand personality is authoritative yet discreet, prioritizing the passenger's comfort and time. The target audience includes high-net-worth individuals, corporate executives, and luxury travelers who value punctuality and impeccable service.

The design style utilizes **High-Contrast Minimalism** with a **Tactile** edge. It leverages expansive whitespace to denote luxury, punctuated by razor-sharp typography and rich, metallic accents. The UI should feel like the interior of a flagship sedan: quiet, precision-engineered, and effortlessly sophisticated. High-quality imagery should be treated with subtle desaturation to ensure the gold accents and white typography command attention.

## Colors

The palette is rooted in a deep, "obsidian" charcoal that provides a more sophisticated depth than pure black. This serves as the primary canvas, creating a cinematic backdrop for all content. 

- **Primary (Deep Charcoal):** Used for all major backgrounds and structural surfaces.
- **Secondary (Metallic Gold):** Used sparingly for high-value calls to action, interactive states, and premium signifiers. Never use for large blocks of text.
- **Tertiary (Crisp White):** Reserved for primary body text and high-contrast headlines to ensure maximum readability against the dark background.
- **Neutral (Slate Gray):** A slightly lighter charcoal (#2A2A2B) used for input fields, secondary containers, and borders to create subtle layering.

## Typography

This design system employs a classic serif-on-sans pairing to balance heritage with modernity. **Playfair Display** is used for all major headings to evoke the feel of high-end editorial magazines and luxury concierge services. **Montserrat** provides a clean, geometric contrast for functional text, ensuring clarity at small sizes.

Uppercase styling with increased letter spacing should be applied to all labels and navigation items to enhance the "premium brand" aesthetic. Body text should maintain generous line heights to prevent the dark interface from feeling cramped.

## Layout & Spacing

The layout philosophy is built on an **8-pixel grid system** with an emphasis on vertical rhythm and "breathing room." 

- **Desktop:** A 12-column fluid grid within a 1280px max-width container. Margins are intentionally wide (64px) to force focus toward the center of the screen.
- **Mobile:** A 4-column grid with 24px margins. 
- **Spacing Logic:** Use `stack-lg` (80px) for separating major sections and `stack-md` (48px) for separating groups within a section. 

The design avoids cluttered "dashboards," instead opting for a linear, progressive disclosure model that guides the user through the booking process one step at a time.

## Elevation & Depth

Depth in this system is achieved through **Tonal Layering** and **Subtle Inner Glows** rather than traditional drop shadows. 

1. **Base:** The primary background (#1A1A1B).
2. **Elevated Surfaces:** Cards and containers use a slightly lighter hex (#242425) with a 1px solid border in a low-opacity white (10% opacity) to define edges.
3. **Interactive Depth:** On hover, cards should not "lift" with a shadow; instead, the 1px border should transition to the Secondary Gold color.
4. **Photography:** Images should be treated as the deepest layer, often appearing behind semi-transparent charcoal overlays to ensure text legibility.

## Shapes

The shape language is **Sharp (0px)**. To communicate precision, engineering, and architectural luxury, all buttons, input fields, and cards utilize 90-degree corners. This "no-radius" approach differentiates the service from "friendly" consumer apps, positioning it as a professional, high-end tool. 

The only exception to the sharp rule is the use of circular decorative elements (like "step" indicators in a booking flow) which should remain perfectly round to provide a geometric counterpoint to the rectangular layout.

## Components

- **Primary Buttons:** Solid Gold (#D4AF37) background with black text. Sharp corners. Use a subtle shine or gradient transition on hover.
- **Secondary Buttons:** Ghost style. 1px White border with white text. Transparent background.
- **Input Fields:** Bottom-border only (1px White) or fully enclosed charcoal boxes with 1px border. Labels should use the `label-caps` typography style.
- **Service Cards:** Large-scale components featuring a background image of the vehicle. Content is overlaid on a bottom-aligned charcoal gradient.
- **Status Indicators:** Use the Gold accent for "Confirmed" or "Active" states. Avoid standard "Success Green" as it clashes with the luxury palette.
- **Progress Steppers:** Vertical, thin lines with small circular nodes to indicate the booking stages (Pickup > Vehicle > Payment > Summary).