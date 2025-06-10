export const AvatarLogo = ({
	image,
	name = "User",
	size = 64,
}: {
	image?: string;
	name?: string;
	size?: number;
}): string => {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const radius = size / 2;
	const hue = Math.floor(Math.random() * 360);
	const bgColor = `hsl(${hue}, 70%, 80%)`;

	if (!image) {
		// Fallback SVG with initials and random bg
		return `
      <svg
        width="${size}"
        height="${size}"
        viewBox="0 0 ${size} ${size}"
        xmlns="http://www.w3.org/2000/svg"
        style="border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${bgColor}" />
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dy=".35em"
          font-size="${size / 3}"
          fill="#fff"
          font-family="Arial, sans-serif"
        >
          ${initials}
        </text>
      </svg>
    `;
	}

	return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      style="border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
      <defs>
        <clipPath id="avatarClip">
          <circle cx="${radius}" cy="${radius}" r="${radius}" />
        </clipPath>
      </defs>
      <image
        href="${image}"
        width="${size}"
        height="${size}"
        clip-path="url(#avatarClip)"
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  `;
};

export const createGoogleMapsMarker = ({
	color = "#0073e6", // Google's blue
	size = 30,
	isActive = false,
}: {
	color?: string;
	size?: number;
	isActive?: boolean;
}) => {
	const innerCircleSize = size * 0.4;
	const outerRingSize = size * 0.8;
	const radarRingSize = size * 1.2;

	// Create a lighter version of the color for the radar ring
	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const totalSize = Math.max(radarRingSize, size) + 10; // Add padding
	const centerX = totalSize / 2;
	const centerY = totalSize / 2;
	const uniqueId = Math.random().toString(36).substr(2, 9);

	const svg = `
    <svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="drop-shadow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
        <style>
          .radar-ring-${uniqueId} {
            animation: pulse-${uniqueId} 2s ease-in-out infinite;
            transform-origin: ${centerX}px ${centerY}px;
          }
          @keyframes pulse-${uniqueId} {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.4;
            }
            100% {
              transform: scale(1);
              opacity: 0.5;
            }
          }
        </style>
      </defs>
      
      <!-- Outer radar ring (pulsing) -->
      ${
				isActive
					? `
      <circle cx="${centerX}" cy="${centerY}" r="${outerRingSize / 2}" 
              fill="${hexToRgba(color, 0.4)}" 
              stroke="${hexToRgba(color, 0.4)}" 
              stroke-width="1"
              class="radar-ring-${uniqueId}" />
      `
					: ""
			}
      
      
      <!-- Main blue circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${innerCircleSize / 2}" 
              fill="${hexToRgba(color, 0.7)}" 
              filter="url(#drop-shadow-${uniqueId})"/>
      
    </svg>
  `;

	return svg;
};

export const createGoogleMapsMarkerStatic = ({
	color = "#4285F4",
	size = 40,
	isActive = false,
}: {
	color?: string;
	size?: number;
	isActive?: boolean;
}) => {
	const centerDotSize = size * 0.25;
	const innerCircleSize = size * 0.4;
	const outerRingSize = size * 0.8;
	const radarRingSize = size * 1.2;

	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const totalSize = Math.max(radarRingSize, size) + 10;
	const centerX = totalSize / 2;
	const centerY = totalSize / 2;

	const svg = `
    <svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${color.replace("#", "")}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      
      <!-- Radar ring (static version) -->
      ${
				isActive
					? `
      <circle cx="${centerX}" cy="${centerY}" r="${radarRingSize / 2}" 
              fill="${hexToRgba(color, 0.1)}" 
              stroke="${hexToRgba(color, 0.25)}" 
              stroke-width="1"/>
      `
					: ""
			}
      
      <!-- Outer ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${outerRingSize / 2}" 
              fill="${hexToRgba(color, 0.2)}" 
              stroke="${hexToRgba(color, 0.4)}" 
              stroke-width="1"/>
      
      <!-- Main blue circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${innerCircleSize / 2}" 
              fill="${color}" 
              filter="url(#shadow-${color.replace("#", "")})"/>
      
      <!-- Center white dot -->
      <circle cx="${centerX}" cy="${centerY}" r="${centerDotSize / 2}" 
              fill="white"/>
    </svg>
  `;

	return svg;
};
