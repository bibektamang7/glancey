import L from "leaflet";

function adjustBrightness(color: string, amount: number) {
	const num = parseInt(color.replace("#", ""), 16);
	const amt = Math.round(2.55 * amount);
	const R = (num >> 16) + amt;
	const G = ((num >> 8) & 0x00ff) + amt;
	const B = (num & 0x0000ff) + amt;
	return (
		"#" +
		(
			0x1000000 +
			(R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
			(G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
			(B < 255 ? (B < 1 ? 0 : B) : 255)
		)
			.toString(16)
			.slice(1)
	);
}
export const createIndriverMarkerSVG = (
	size = 30,
	color = "",
	isActive = false,
	imageUrl = null,
	fallbackChar = "P"
) => {
	return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${isActive ? "active" : "inactive"}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="${isActive ? "4" : "2"}" flood-opacity="${isActive ? "0.4" : "0.25"}" flood-color="#000000" stdDeviation="${isActive ? "3" : "2"}"/>
        </filter>
        <linearGradient id="markerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${isActive ? adjustBrightness(color, 15) : color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, isActive ? -15 : -25)};stop-opacity:1" />
        </linearGradient>
        <clipPath id="avatarClip">
          <circle cx="50" cy="35" r="18"/>
        </clipPath>
      </defs>
      
      <!-- Crosshair rings when active -->
      ${
				isActive
					? `
      <g class="crosshair-rings">
        <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3" class="ring-1"/>
        <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="1" opacity="0.2" class="ring-2"/>
      </g>
      `
					: ""
			}
      
      <!-- Main marker container -->
      <g class="marker-main" transform="translate(0, ${isActive ? "-2" : "0"})">
        <!-- Marker pin body -->
        <path d="M50,20 C35,20 25,30 25,45 C25,55 35,65 45,75 L50,85 L55,75 C65,65 75,55 75,45 C75,30 65,20 50,20 Z"
          fill="url(#markerGradient)" 
          stroke="#ffffff" 
          stroke-width="2"
          filter="url(#shadow-${isActive ? "active" : "inactive"})"
          class="marker-body" />
          
        <!-- Inner content circle -->
        <circle cx="50" cy="35" r="18" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        
        <!-- Avatar or fallback -->
        ${
					imageUrl
						? `<image href="${imageUrl}" x="32" y="17" width="36" height="36" clip-path="url(#avatarClip)" onerror="this.style.display='none'"/>`
						: `<text x="50" y="42" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="${color}" font-weight="bold">${fallbackChar}</text>`
				}
        
        <!-- Subtle highlight -->
        <ellipse cx="45" cy="30" rx="3" ry="4" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
      </g>
      
      <!-- Ground shadow -->
      <ellipse cx="50" cy="110" rx="${isActive ? "12" : "8"}" ry="${isActive ? "4" : "3"}" fill="rgba(0,0,0,0.2)" opacity="${isActive ? "0.6" : "0.4"}" class="ground-shadow"/>
      
      <style>
        <![CDATA[
          .marker-main {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: 50px 85px;
          }
          
          .marker-body {
            transition: all 0.3s ease;
          }
          
          .ground-shadow {
            transition: all 0.3s ease;
          }
          
          ${
						isActive
							? `
          .marker-main {
            animation: indriver-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          
          @keyframes indriver-bounce {
            0% { transform: translateY(0) scale(1); }
            30% { transform: translateY(-8px) scale(1.05); }
            60% { transform: translateY(-4px) scale(1.02); }
            100% { transform: translateY(-2px) scale(1); }
          }
          
          .crosshair-rings .ring-1 {
            animation: crosshair-pulse 2s infinite ease-in-out;
          }
          
          .crosshair-rings .ring-2 {
            animation: crosshair-pulse-outer 2s infinite ease-in-out 0.5s;
          }
          
          @keyframes crosshair-pulse {
            0%, 100% {
              r: 35;
              opacity: 0.3;
            }
            50% {
              r: 42;
              opacity: 0.1;
            }
          }
          
          @keyframes crosshair-pulse-outer {
            0%, 100% {
              r: 45;
              opacity: 0.2;
            }
            50% {
              r: 52;
              opacity: 0.05;
            }
          }
          `
							: ""
					}
        ]]>
      </style>
    </svg>
  `;
};

export const createCustomMarkerIcon = ({
	imageUrl,
	fallbackChar = "K",
	color = "#e11d48", // red
	circleBackground = "#fef3c7", // light yellow
	size = 50,
	isActive = false,
}: {
	imageUrl?: string;
	fallbackChar?: string;
	color?: string;
	circleBackground?: string;
	size?: number;
	isActive: boolean;
}) => {
	const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${isActive ? "active" : "inactive"}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="${isActive ? "4" : "2"}" flood-opacity="${isActive ? "0.4" : "0.25"}" flood-color="#000000" stdDeviation="${isActive ? "3" : "2"}"/>
        </filter>
        <linearGradient id="markerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${isActive ? adjustBrightness(color, 15) : color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, isActive ? -15 : -25)};stop-opacity:1" />
        </linearGradient>
        <clipPath id="avatarClip">
          <circle cx="50" cy="35" r="18"/>
        </clipPath>
      </defs>
      
      <!-- Crosshair rings when active -->
      ${
				isActive
					? `
      <g class="crosshair-rings">
        <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3" class="ring-1"/>
        <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="1" opacity="0.2" class="ring-2"/>
      </g>
      `
					: ""
			}
      
      <!-- Main marker container -->
      <g class="marker-main" transform="translate(0, ${isActive ? "-2" : "0"})">
        <!-- Marker pin body -->
        <path d="M50,20 C35,20 25,30 25,45 C25,55 35,65 45,75 L50,85 L55,75 C65,65 75,55 75,45 C75,30 65,20 50,20 Z"
          fill="url(#markerGradient)" 
          stroke="#ffffff" 
          stroke-width="2"
          filter="url(#shadow-${isActive ? "active" : "inactive"})"
          class="marker-body" />
          
        <!-- Inner content circle -->
        <circle cx="50" cy="35" r="18" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        
        <!-- Avatar or fallback -->
        ${
					imageUrl
						? `<image href="${imageUrl}" x="32" y="17" width="36" height="36" clip-path="url(#avatarClip)" onerror="this.style.display='none'"/>`
						: `<text x="50" y="42" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="${color}" font-weight="bold">${fallbackChar}</text>`
				}
        
        <!-- Subtle highlight -->
        <ellipse cx="45" cy="30" rx="3" ry="4" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
      </g>
      
      <!-- Ground shadow -->
      <ellipse cx="50" cy="110" rx="${isActive ? "12" : "8"}" ry="${isActive ? "4" : "3"}" fill="rgba(0,0,0,0.2)" opacity="${isActive ? "0.6" : "0.4"}" class="ground-shadow"/>
      
      <style>
        <![CDATA[
          .marker-main {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: 50px 85px;
          }
          
          .marker-body {
            transition: all 0.3s ease;
          }
          
          .ground-shadow {
            transition: all 0.3s ease;
          }
          
          ${
						isActive
							? `
          .marker-main {
            animation: indriver-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          
          @keyframes indriver-bounce {
            0% { transform: translateY(0) scale(1); }
            30% { transform: translateY(-8px) scale(1.05); }
            60% { transform: translateY(-4px) scale(1.02); }
            100% { transform: translateY(-2px) scale(1); }
          }
          
          .crosshair-rings .ring-1 {
            animation: crosshair-pulse 2s infinite ease-in-out;
          }
          
          .crosshair-rings .ring-2 {
            animation: crosshair-pulse-outer 2s infinite ease-in-out 0.5s;
          }
          
          @keyframes crosshair-pulse {
            0%, 100% {
              r: 35;
              opacity: 0.3;
            }
            50% {
              r: 42;
              opacity: 0.1;
            }
          }
          
          @keyframes crosshair-pulse-outer {
            0%, 100% {
              r: 45;
              opacity: 0.2;
            }
            50% {
              r: 52;
              opacity: 0.05;
            }
          }
          `
							: ""
					}
        ]]>
      </style>
    </svg>
  `;
	// 	const svg = `
	//     <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
	//       <path d="M256,0 C167,0 96,71 96,160 C96,256 256,512 256,512 C256,512 416,256 416,160 C416,71 345,0 256,0 Z"
	//         fill="${color}" />
	//       ${
	// 				imageUrl
	// 					? `<image href="${imageUrl}" x="166" y="80" width="180" height="180" clip-path="circle(90px at center)" onerror="this.style.display='none'" />`
	// 					: `<text x="256" y="185" text-anchor="middle" font-size="100" font-family="sans-serif" fill="#ffffff" font-weight="bold">${fallbackChar}</text>`
	// 			}
	//     </svg>
	//   `;

	// Helper function to adjust color brightness
	function adjustBrightness(color: string, amount: number) {
		const num = parseInt(color.replace("#", ""), 16);
		const amt = Math.round(2.55 * amount);
		const R = (num >> 16) + amt;
		const G = ((num >> 8) & 0x00ff) + amt;
		const B = (num & 0x0000ff) + amt;
		return (
			"#" +
			(
				0x1000000 +
				(R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
				(G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
				(B < 255 ? (B < 1 ? 0 : B) : 255)
			)
				.toString(16)
				.slice(1)
		);
	}

	return L.divIcon({
		html: svg,
		className: "",
		iconSize: [size, size],
		iconAnchor: [size / 2, size],
		popupAnchor: [0, -size],
	});
};
