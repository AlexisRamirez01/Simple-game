import { useEffect, useState } from "react";

function ClockAntique({ players, maxPlayers }) {
  const [horaDeg, setHoraDeg] = useState(0);
  const [minutoDeg, setMinutoDeg] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    const ratio = players / maxPlayers;
    setHoraDeg(ratio * 360);
    setMinutoDeg(ratio * 360);

    if (players >= maxPlayers) {
      setIsJumping(true);
    } else {
      setIsJumping(false);
    }
  }, [players, maxPlayers]);

  const impactX = 170;
  const impactY = 90;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        data-testid = "clock-svg"
        className={isJumping ? "jumping" : ""}
        width="282"   // 256 * 1.1
        height="282"  // 256 * 1.1
        viewBox="0 0 256 256" // mantiene coordenadas originales
      >
        {/* Fondo del reloj */}
        <circle
          cx="128"
          cy="128"
          r="124"
          fill="#d4af37"
          stroke="#8b6f34"
          strokeWidth="6"
        />
        <circle cx="128" cy="128" r="118" fill="#f5f0e1" />

        {/* Cristal */}
        <circle cx="128" cy="128" r="110" fill="url(#brilloCristal)" />
        <defs>
          <radialGradient id="brilloCristal" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Marcas de horas */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 128 + Math.cos(angle) * 100;
          const y1 = 128 + Math.sin(angle) * 100;
          const x2 = 128 + Math.cos(angle) * 110;
          const y2 = 128 + Math.sin(angle) * 110;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#333"
              strokeWidth="3"
            />
          );
        })}

        {/* Aguja hora */}
        <line
          data-testid="manecilla-hora"
          x1="128"
          y1="128"
          x2="128"
          y2="78"
          stroke="#333"
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${horaDeg},128,128)`}
        />

        {/* Aguja minuto */}
        <line
          data-testid="manecilla-minuto"
          x1="128"
          y1="128"
          x2="128"
          y2="48"
          stroke="#555"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${minutoDeg},128,128)`}
        />

        {/* Centro */}
        <circle cx="128" cy="128" r="6" fill="#333" />

        {/* Cristal roto */}
        <g stroke="rgba(0,0,0,0.5)" strokeWidth="2">
          <line x1={impactX} y1={impactY} x2={200} y2={80} />
          <line x1={impactX} y1={impactY} x2={220} y2={100} />
          <line x1={impactX} y1={impactY} x2={200} y2={120} />
          <line x1={impactX} y1={impactY} x2={170} y2={140} />
          <line x1={impactX} y1={impactY} x2={150} y2={100} />
          <line x1={impactX} y1={impactY} x2={160} y2={80} />
          <line
            x1={impactX + 10}
            y1={impactY + 10}
            x2={impactX + 20}
            y2={impactY + 30}
          />
          <line
            x1={impactX + 20}
            y1={impactY + 20}
            x2={impactX + 10}
            y2={impactY + 40}
          />
          <line
            x1={impactX - 10}
            y1={impactY + 20}
            x2={impactX}
            y2={impactY + 40}
          />
        </g>
      </svg>

      <style>
        {`
          .jumping {
            animation: jump 0.5s infinite alternate;
          }

          @keyframes jump {
            0% { transform: translateY(0); }
            100% { transform: translateY(-15px); }
          }
        `}
      </style>
    </div>
  );
}

export default ClockAntique;
