# Speech Bubble CSS Consolidation Plan

## Current State Analysis

### 1. **speech-bubble.css** (lines 18-32)
```css
.speechBubble {
    position: relative;
    background: #10347c;      /* Blue background */
    border-radius: 23%;
    padding: 5vw;
    margin: 0 auto;
    margin-top: 2vh;
    max-width: 80vw;
    min-height: 65vw;         /* Different min-height */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    transition: none;
}
```

### 2. **styles.css** (lines 345-361)
```css
.speechBubble {
    position: relative;
    background-color: #000080;  /* Different blue */
    border-radius: 23%;
    padding: 5vw;
    margin: 0 auto;
    margin-top: 2vh;
    max-width: 80vw;
    min-width: 200px;          /* Additional min-width */
    min-height: 30vw;          /* Different min-height */
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */  /* Commented out */
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    transition: none;
    z-index: 2;                /* Additional z-index */
}
```

### 3. **layout.css** (lines 112-120)
```css
.speechBubble {
    width: 100%;               /* Different width approach */
    background-color: #fff;    /* WHITE background! */
    color: #000;              /* Black text */
    border-radius: 10px;      /* Different border-radius */
    padding: 10px;            /* Different padding */
    margin-bottom: 20px;      /* Different margin */
    position: relative;
}
```

## Consolidation Strategy

### Step 1: Identify Primary Use Case
Based on the game context and the presence of speech bubble pointers, the primary `.speechBubble` appears to be for game questions/answers (used in speech-bubble.css and styles.css).

### Step 2: Create Unified Base Style
Create a single, authoritative definition in `speech-bubble.css`:

```css
/* Primary speech bubble for game content */
.speechBubble {
    position: relative;
    background: #10347c;  /* Jeopardy blue */
    border-radius: 23%;
    padding: 5vw;
    margin: 0 auto;
    margin-top: 2vh;
    max-width: 80vw;
    min-width: 200px;
    min-height: 30vw;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    transition: none;
    z-index: 2;
}

/* Speech bubble pointer */
.speechBubble::after,
.speechBubble::before {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
}

/* Primary pointer style (from speech-bubble.css) */
.speechBubble::after {
    border-left: 20px solid transparent;
    border-right: 20px solid transparent;
    border-top: 20px solid #10347c;
}

/* Alternative pointer style (from styles.css) - consider removing or making a modifier class */
.speechBubble--asymmetric::before {
    left: 33%;
    border-style: solid;
    border-width: 30px 30px 0 0;
    border-color: #000080 transparent transparent transparent;
    transition: left 0.8s ease-in-out;
    z-index: 10;
}
```

### Step 3: Create Variant Classes
For the layout.css version (white background), create a modifier class:

```css
/* Alternative speech bubble style - possibly for different context */
.speechBubble--alt {
    width: 100%;
    background-color: #fff;
    color: #000;
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 20px;
    min-height: auto;  /* Override base min-height */
}

.speechBubble--alt::before {
    bottom: -10px;
    left: 50%;
    margin-left: -10px;
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: #fff transparent;
}
```

### Step 4: File Organization

1. **Keep in `speech-bubble.css`**: 
   - All `.speechBubble` base styles
   - All modifier classes (--alt, --asymmetric, etc.)
   - Related component styles (#categoryBox, #valueBox, #questionBox, #answerBox)

2. **Remove from `styles.css`**:
   - Lines 344-376 (entire .speechBubble definition and ::before pseudo-element)
   - Keep the media queries (lines 882-910) but move them to speech-bubble.css

3. **Remove from `layout.css`**:
   - Lines 112-131 (entire .speechBubble definition and ::before pseudo-element)
   - Or rename this class to something more specific if it serves a different purpose

### Step 5: Media Query Consolidation

Combine all speech bubble media queries in `speech-bubble.css`:

```css
/* Media Queries for Speech Bubble */
@media screen and (max-width: 480px) {
    .speechBubble {
        padding: 15px;
        width: 95%;  /* From speech-bubble.css line 86 */
    }
}

@media screen and (max-width: 768px) {
    /* From speech-bubble.css lines 84-107 */
    .speechBubble {
        width: 95%;
    }
    /* ... other responsive styles ... */
}

@media screen and (max-width: 770px) {
    /* From styles.css lines 898-910 */
    .speechBubble {
        max-width: 90vw;
        min-height: 30vh;
        margin-top: 1vh;
    }
    
    .speechBubble::before {
        left: 50%;
        transform: translateX(-10px);
    }
}

@media screen and (max-width: 1024px) {
    /* From styles.css lines 890-895 */
    .speechBubble {
        max-width: 85vw;
        min-height: 40vw;
    }
}

@media (orientation: landscape) and (max-height: 600px) {
    /* From styles.css lines 914-918 */
    .speechBubble {
        min-height: 30vh;
    }
}
```

## Implementation Steps

1. **Backup current files** before making changes
2. **Update speech-bubble.css** with consolidated styles
3. **Remove duplicate definitions** from styles.css and layout.css
4. **Test all pages** that use .speechBubble to ensure no visual regressions
5. **Update any HTML** that might need the new modifier classes
6. **Consider creating a base.css** file for truly shared styles across components

## Benefits

- **Single source of truth** for speech bubble styles
- **Easier maintenance** - changes in one place
- **Clear variant system** with modifier classes
- **Reduced file size** by eliminating duplicates
- **Better performance** - fewer CSS rules to parse
- **Clearer intent** - developers know where to find/modify speech bubble styles
