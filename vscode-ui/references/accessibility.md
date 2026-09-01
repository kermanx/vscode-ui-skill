# Accessibility

Apply this checklist to every interactive surface. Compact UI must remain fully operable without a mouse and understandable without color or vision.

## Structure and names

- Prefer native semantic elements before adding ARIA.
- Give every interactive element an accessible name. Use visible text first, then `aria-labelledby`, then `aria-label` for icon-only controls.
- Hide decorative duplicate icons with `aria-hidden="true"`.
- Expose widget state with `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current`, and `aria-invalid` as appropriate.
- Use correct composite roles and relationships for trees, grids, tablists, menus, toolbars, and dialogs. Follow the corresponding WAI-ARIA keyboard pattern.
- Preserve correct item position and total count for virtualized lists and trees.

## Keyboard and focus

- Make every pointer action keyboard-operable.
- Keep a logical `Tab` order. Use arrow keys inside composite widgets rather than adding every row to the page tab sequence.
- Dismiss popovers, menus, and dialogs with `Escape`; restore focus to the opener.
- Trap focus only inside a modal dialog, and release it on close.
- Never reveal essential controls on hover alone; pair hover with `:focus-within` or persistent keyboard access.
- Do not remove focus indicators. Use `:focus-visible` so the ring appears for keyboard intent rather than every pointer click.

```css
.ui-focusable:focus-visible {
  outline: 1px solid var(--ui-focus);
  outline-offset: -1px;
}

input[type="checkbox"]:focus-visible {
  outline-offset: 2px;
}
```

## Text and dynamic content

- Provide an accessible tooltip on both hover and focus when visible text is truncated.
- Associate descriptions and validation with their controls through `aria-describedby`.
- Use a polite live region for result counts, progress, and non-urgent updates. Use an assertive alert only for urgent errors or action results that require immediate attention.
- Keep announcements concise and avoid announcing the same event twice.
- Do not encode status by color alone; add text, icon shape, or another non-color cue.

## Themes and perception

- Verify normal text at `4.5:1` contrast and large text or meaningful non-text UI at `3:1` unless a stricter product requirement applies.
- Provide light, dark, high-contrast light, and high-contrast dark theme values.
- Use solid high-contrast backgrounds and explicit borders. Remove shadows that disappear or create noise in high contrast.
- Preserve usable focus, selection, disabled, hover, error, and warning distinctions in every theme.
- Test zoom and text scaling without hiding primary actions, causing two-dimensional page scrolling, or clipping labels.

## Motion

- Honor `prefers-reduced-motion`.
- Use motion only to guide, confirm, orient, or smooth a state change.
- Keep transitions interruptible. Remove decorative loops, bounce, and parallax.

```css
@media (prefers-reduced-motion: reduce) {
  .ui-motion {
    scroll-behavior: auto;
    animation: none;
    transition: none;
  }
}
```

## Verification

- Navigate the complete flow with keyboard only.
- Check focus entry, movement, dismissal, and restoration.
- Inspect the accessibility tree and spoken names, roles, states, and live updates.
- Test a screen reader for custom composites and dynamic content.
- Test narrow containers, long localized strings, zoom, reduced motion, and all four theme modes.
