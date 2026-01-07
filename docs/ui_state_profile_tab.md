# Profile Tab UI States

## Icons
- Default: 24x24, stroke currentColor, fill none
- Hover: color shifts to var(--gold-light), slight translateY(-1px)
- Active: returns to baseline, minimal scale change via button active
- Accessibility: buttons include aria-label; respects prefers-reduced-motion

## Inputs (Floating Fields)
- Default: subtle border, placeholder used for :placeholder-shown
- Focus: border-color var(--gold-primary), glow 2px, label floats to 10px
- Filled: label remains floated with var(--gold-light)
- Error: .error class sets border var(--danger), focus glow red
- Disabled: opacity 0.6, pointer-events none

## Buttons
- Hover: color transition to var(--gold-light)
- Active: scale(0.98) micro-interaction
- Focus-visible: 2px outline glow for keyboard users

## Scrollbars (dropdown-content)
- Track: rgba(255,255,255,0.05)
- Thumb: rgba(212,175,55,0.3), radius 8px, 2px border
- Firefox: scrollbar-color and thin width
- Touch targets: avatar edit button min 36x36

## Animations
- Tab transition: fadeIn 200ms using opacity/transform
- Spinner: 24x24 border-top uses var(--gold-primary)
- Reduced motion: animations/transitions disabled under prefers-reduced-motion

## Themes
- Dark: default variables
- Light: body.theme-light overrides for surfaces, inputs

## Responsiveness
- Mobile: single-column, content scrollable; touch targets ≥36px
- Desktop: standard spacing; dropdown max-height 400px

## Performance
- Transitions limited to transform/opacity where possible
- Durations ≤200ms; target 60fps

