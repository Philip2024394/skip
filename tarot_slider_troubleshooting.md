# Tarot Card Slider Black Overlay Troubleshooting

## Issue Identified: Half-Page Black Blocking Background Image

### 🚨 Root Causes Found:

#### 1. **Main Culprit: Bottom Sheet Black Background**
**Location**: Line 293 in TarotDrawer.tsx
```tsx
background: "#000000",  // This creates the black overlay!
```

#### 2. **Backdrop Overlay** 
**Location**: Lines 274 & 695
```tsx
background: "rgba(0,0,0,0.75)",  // Backdrop behind sheet
background: "rgba(0,0,0,0.85)",  // Modal backdrop
```

#### 3. **Content Areas with Dark Backgrounds**
Multiple content sections have dark backgrounds that may be blocking the view:
- `rgba(0,0,0,0.55)` - WhatsApp share area
- `rgba(0,0,0,0.72)` - Card selection areas  
- `linear-gradient(135deg, rgba(20,0,40,0.95), rgba(40,10,60,0.95))` - Premium options

### 🔍 Why Previous Fixes Didn't Work

Previous attempts removed:
- ✅ Black shade overlay (REMOVED)
- ✅ Gradient background (REMOVED)

**But missed the main issue**: The entire bottom sheet container has `background: "#000000"`

### 🎯 Complete Fix Required

#### **Primary Fix: Remove Bottom Sheet Black Background**
```tsx
// CHANGE THIS:
background: "#000000",

// TO THIS:
background: "transparent",
```

#### **Secondary: Check Content Area Heights**
The hero area is only `260px` height, but the sheet is `92vh`. The remaining area may need proper background handling.

#### **Tertiary: Verify Image Z-Index**
Ensure background image has proper z-index and isn't being covered by other elements.

### 🛠️ Step-by-Step Fix

#### Step 1: Fix Bottom Sheet Background
```tsx
<div style={{
  // ... other styles
  background: "transparent", // Remove black background
  // ... other styles
}}>
```

#### Step 2: Ensure Background Image Visibility
```tsx
<img
  src={GRAVEYARD_BG}
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    zIndex: 0,  // Ensure it's behind everything
    pointerEvents: "none",
  }}
/>
```

#### Step 3: Check Content Area Backgrounds
Content areas should have transparent or semi-transparent backgrounds to show the image beneath.

### 🧪 Testing Checklist

After applying fixes:

- [ ] Background image fully visible in hero area
- [ ] No black overlay blocking the image
- [ ] Content text still readable (may need text shadows)
- [ ] All interactive elements functional
- [ ] Mobile and desktop display correct

### 🎨 Alternative Approaches

If transparency causes readability issues:

#### Option 1: Semi-Transparent Background
```tsx
background: "rgba(0,0,0,0.3)", // Light tint instead of solid black
```

#### Option 2: Gradient Fade
```tsx
background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)",
```

#### Option 3: Glass Morphism
```tsx
background: "rgba(255,255,255,0.1)",
backdropFilter: "blur(10px)",
```

### 🔧 Debugging Steps

1. **Inspect Element**: Check which element has the black background
2. **Toggle Visibility**: Use dev tools to hide elements one by one
3. **Check Z-Index**: Ensure image is behind content but visible
4. **Verify Heights**: Check if content areas are covering the image

### 📱 Mobile Considerations

- Ensure image loads properly on mobile
- Check safe area insets
- Verify touch targets still work
- Test scroll behavior

### 🎯 Expected Result

After fixing:
- Full graveyard background image visible
- Content overlaid with proper transparency
- Readable text with appropriate contrast
- Functional interactive elements
- Consistent mobile/desktop experience

## Next Actions

1. Apply the bottom sheet background fix
2. Test background image visibility  
3. Adjust content transparency if needed
4. Verify all functionality works
5. Test on multiple screen sizes
