# Card Section Spacing Standards

These standards ensure consistent spacing across the card section and related pages.

## Baseline
- Base unit: 8px.
- Page container: `max-w-screen-xl`, `mx-auto`, `px-5`.

## Between Cards
- Layout: CSS Grid.
  - `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
  - Gaps: `gap-4` (16px) on mobile, `sm:gap-6` (24px) tablet and up.

## Inside Cards (NewsCardPreview)
- Outer padding: `p-2` (8px).
- Image block: `h-28` with `mb-2`.
- Title: `mb-2`.
- Date: `mb-2`.
- Description: one-line ellipsis, no fixed height, `mb-2`.
- Actions: `mt-2`.

## Alignment
- Section headings: `mb-6` below the title.
- Cards are aligned within the page container; no additional outer margins.

## Responsive
- Card size remains `w-[265px] h-[320px]` where specified by design.
- Grid adjusts column count via breakpoints for even distribution.

## Accessibility
- ARIA labels preserved on card components.
- No spacing change impacts focus order or keyboard navigation.

## Notes
- Avoid fixed heights for variable text blocks; use content-driven spacing.
- Prefer `space-y-*` or consistent `mb-*` stacks to maintain rhythm.