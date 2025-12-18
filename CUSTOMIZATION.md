# TheoAgent - Customization Guide

## Logo Customization

The TheoAgent logo is located at `public/logo.svg`. You can easily customize it:

### Option 1: Replace with your own SVG
Simply replace the `public/logo.svg` file with your own SVG logo (recommended size: 48x48 or 64x64 pixels).

### Option 2: Edit the existing SVG
Open `public/logo.svg` in any text editor and modify:
- Colors: Change the gradient stop colors (`#3b82f6` and `#9333ea`)
- Cross design: Modify the rectangles and circle elements
- Background: Adjust the outer circle's radius or fill

### Option 3: Use a PNG/JPG image
1. Place your image file in the `public` folder (e.g., `public/logo.png`)
2. Update the Image src in `src/app/page.tsx`:
   - Change `<Image src="/logo.svg"` to `<Image src="/logo.png"`

## Color Scheme Customization

The app uses a blue-to-purple gradient theme. To change colors:

### Primary Gradient Colors
In `src/app/page.tsx`, replace these classes:
- `from-blue-600 to-purple-600` - Main gradient
- `from-blue-50 via-purple-50 to-pink-50` - Background gradient

### Available Tailwind Color Options
- Red: `from-red-600 to-orange-600`
- Green: `from-green-600 to-emerald-600`
- Gold: `from-amber-600 to-yellow-600`
- Purple: `from-purple-600 to-pink-600`
- Blue: `from-blue-600 to-cyan-600`

Just search and replace the gradient classes throughout the file.

## Typography Customization

Update the font in `src/app/layout.tsx` by importing different Google Fonts or system fonts.

Current fonts are defined in the layout file and can be changed globally.

## Message Styling

Messages use Tailwind's prose classes for beautiful markdown rendering. To customize:

```tsx
// In page.tsx, find the prose classes:
prose prose-sm max-w-none prose-headings:font-semibold ...
```

Available prose modifications:
- `prose-sm` / `prose-base` / `prose-lg` - Size
- `prose-gray` / `prose-blue` / `prose-purple` - Color theme
- `prose-headings:...` - Heading styles
- `prose-a:...` - Link styles

## Custom Scrollbar

The custom scrollbar styling is in `src/app/globals.css`. Change the colors to match your theme:

```css
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #9333ea);
}
```

## Further Customization

Feel free to modify any of the styles in `src/app/page.tsx`. The component uses:
- Tailwind CSS for styling
- ReactMarkdown for message formatting
- Next.js Image for optimized images

Happy customizing! ✝
