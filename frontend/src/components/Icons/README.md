# 🎨 **Sistema Icone Custom**

## 📁 **Struttura File**
```
/frontend/src/components/Icons/
├── README.md           (questa guida)
├── index.ts           (export delle icone)
├── MenuIcon.tsx       (icona menu hamburger)
├── ExportIcon.tsx     (icona export)
├── DashboardIcon.tsx  (icona dashboard)
└── ...altre icone
```

## 🔧 **Come Aggiungere Icone Custom**

### **1. Crea il componente icona:**
```tsx
// /frontend/src/components/Icons/MenuIcon.tsx
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const MenuIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      <path 
        d="M3 12h18M3 6h18M3 18h18" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default MenuIcon;
```

### **2. Aggiungi all'index:**
```tsx
// /frontend/src/components/Icons/index.ts
export { default as MenuIcon } from './MenuIcon';
export { default as ExportIcon } from './ExportIcon';
export { default as DashboardIcon } from './DashboardIcon';
```

### **3. Usa nell'app:**
```tsx
// In Orders.tsx
import { MenuIcon, ExportIcon } from '../components/Icons';

// Sostituisci emoji con icone:
<MenuIcon size={20} color="white" />
<ExportIcon size={20} color="white" />
```

## 🎨 **Fonti per Icone**

### **Icone SVG Gratuite:**
- **Heroicons**: https://heroicons.com/
- **Lucide**: https://lucide.dev/
- **Feather**: https://feathericons.com/
- **Phosphor**: https://phosphoricons.com/

### **Icone Nautiche Specifiche:**
- **Flaticon**: https://www.flaticon.com/ (cerca "nautical", "boat", "anchor")
- **Icons8**: https://icons8.com/
- **The Noun Project**: https://thenounproject.com/

## 🔄 **Sostituzione Emoji Attuali**

### **Emoji da sostituire:**
- `☰` → MenuIcon
- `📊` → ExportIcon  
- `🏠` → DashboardIcon
- `💰` → OrdersIcon
- `🔧` → WorksIcon
- `⚓` → BoatsIcon
- `🏥` → InfirmaryIcon
- `🚢` → LogoIcon

### **Esempio sostituzione:**
```tsx
// Prima (emoji)
<span>☰</span>

// Dopo (icona custom)
<MenuIcon size={20} color={showSidebar ? 'white' : '#2C3E50'} />
```

## 🎯 **Vantaggi Icone Custom**
- ✅ **Consistenza**: Stesso stile in tutta l'app
- ✅ **Personalizzazione**: Colori e dimensioni dinamiche
- ✅ **Performance**: SVG ottimizzati
- ✅ **Accessibilità**: Supporto screen reader
- ✅ **Branding**: Icone uniche per il centro nautico

## 🚀 **Next Steps**
1. Crea le icone base (Menu, Export, Dashboard)
2. Sostituisci gradualmente le emoji
3. Aggiungi icone specifiche nautiche
4. Ottimizza per accessibilità
