'use strict';

export function getHostEra(year) {
  if (year >= 2020) {
    return {
      era: 'modern',
      decade: '2020s',
      outfit: 'wearing a sleek, minimalist dark suit with subtle patterns',
      style: 'Clean, modern aesthetic with sharp lines',
      vibe: 'Contemporary and polished',
      colorScheme: '#2c3e50',
    };
  }
  
  if (year >= 2010) {
    return {
      era: '2010s',
      decade: '2010s',
      outfit: 'rocking a slim-fit navy blazer with rolled sleeves and chinos',
      style: 'Hipster-chic with modern tailoring',
      vibe: 'Casual yet professional',
      colorScheme: '#34495e',
    };
  }
  
  if (year >= 2000) {
    return {
      era: '2000s',
      decade: '2000s',
      outfit: 'sporting a pinstripe suit with slightly wider lapels and a colorful tie',
      style: 'Y2K business casual at its finest',
      vibe: 'Confident and era-appropriate',
      colorScheme: '#8e44ad',
    };
  }
  
  if (year >= 1990) {
    return {
      era: '90s',
      decade: '1990s',
      outfit: 'dressed in a double-breasted suit with shoulder pads and a bold patterned tie',
      style: 'Full 90s power suit energy',
      vibe: 'Bold, confident, unmistakably 90s',
      colorScheme: '#e74c3c',
    };
  }
  
  // 1980s and earlier
  return {
    era: '80s',
    decade: '1980s',
    outfit: 'wearing a bright, patterned blazer with rolled sleeves and pastel colors',
    style: 'Peak 80s fashion - Miami Vice vibes',
    vibe: 'Colorful, bold, absolutely iconic',
    colorScheme: '#f39c12',
  };
}

export function getHostDescription(year) {
  const era = getHostEra(year);
  return `Your host is ${era.outfit}. ${era.style}. ${era.vibe}.`;
}
