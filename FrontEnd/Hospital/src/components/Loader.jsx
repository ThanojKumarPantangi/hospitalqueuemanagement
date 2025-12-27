import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledWrapper>
      <svg xmlns="http://www.w3.org/2000/svg" height={200} width={200}>
        <g>
          {/* Outer bouncing frames */}
          <polygon
            id="bounce"
            transform="rotate(45 100 100)"
            strokeWidth={1}
            stroke="#d3a410"
            fill="none"
            points="70,70 148,50 130,130 50,150"
          />
          <polygon
            id="bounce2"
            transform="rotate(45 100 100)"
            strokeWidth={1}
            stroke="#d3a410"
            fill="none"
            points="70,70 148,50 130,130 50,150"
          />

          {/* Main body */}
          <polygon
            transform="rotate(45 100 100)"
            strokeWidth={2}
            stroke="#414750"
            fill="#414750"
            points="70,70 150,50 130,130 50,150"
          />

          <polygon
            strokeWidth={2}
            stroke="#1e2026"
            fill="url(#gradiente)"
            points="100,70 150,100 100,130 50,100"
          />

          {/* Gradient 1 */}
          <defs>
            <linearGradient id="gradiente" x1="0%" y1="0%" x2="10%" y2="100%">
              <stop offset="20%" stopColor="#1e2026" />
              <stop offset="60%" stopColor="#414750" />
            </linearGradient>
          </defs>

          {/* Side structures */}
          <polygon
            transform="translate(20, 31)"
            strokeWidth={2}
            stroke="#b7870f"
            fill="#b7870f"
            points="80,50 80,75 80,99 40,75"
          />
          <polygon
            transform="translate(20, 31)"
            strokeWidth={2}
            stroke="#d3a410"
            fill="url(#gradiente2)"
            points="40,-40 80,-40 80,99 40,75"
          />

          {/* Gradient 2 */}
          <defs>
            <linearGradient id="gradiente2" x1="10%" y1="-17%" x2="0%" y2="100%">
              <stop offset="20%" stopColor="#d3a51000" />
              <stop
                offset="100%"
                stopColor="#d3a51054"
                className="animatedStop"
              />
            </linearGradient>
          </defs>

          <polygon
            transform="rotate(180 100 100) translate(20, 20)"
            strokeWidth={2}
            stroke="#d3a410"
            fill="#d3a410"
            points="80,50 80,75 80,99 40,75"
          />

          <polygon
            transform="translate(60, 20)"
            strokeWidth={2}
            stroke="#d3a410"
            fill="url(#gradiente3)"
            points="40,-40 80,-40 80,85 40,110.2"
          />

          {/* Gradient 3 */}
          <defs>
            <linearGradient id="gradiente3" x1="0%" y1="0%" x2="10%" y2="100%">
              <stop offset="20%" stopColor="#d3a51000" />
              <stop
                offset="100%"
                stopColor="#d3a51054"
                className="animatedStop"
              />
            </linearGradient>
          </defs>

          {/* Particles */}
          <polygon
            className="particle"
            transform="rotate(45 100 100) translate(80, 95)"
            fill="#ffe4a1"
            points="5,0 5,5 0,5 0,0"
          />
          <polygon
            className="particle"
            transform="rotate(45 100 100) translate(80, 55)"
            fill="#ccb069"
            points="6,0 6,6 0,6 0,0"
          />
          <polygon
            className="particle"
            transform="rotate(45 100 100) translate(70, 80)"
            fill="#ffffff"
            points="2,0 2,2 0,2 0,0"
          />

          {/* Base */}
          <polygon
            strokeWidth={2}
            stroke="#292d34"
            fill="#292d34"
            points="29.5,99.8 100,142 100,172 29.5,130"
          />
          <polygon
            transform="translate(50, 92)"
            strokeWidth={2}
            stroke="#1f2127"
            fill="#1f2127"
            points="50,50 120.5,8 120.5,35 50,80"
          />
        </g>
      </svg>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  @keyframes bounce {
    0%,
    100% {
      translate: 0 36px;
    }
    50% {
      translate: 0 46px;
    }
  }

  @keyframes bounce2 {
    0%,
    100% {
      translate: 0 46px;
    }
    50% {
      translate: 0 56px;
    }
  }

  @keyframes umbral {
    0%,
    100% {
      stop-color: #d3a5102e;
    }
    50% {
      stop-color: rgba(211, 165, 16, 0.52);
    }
  }

  @keyframes particles {
    0%,
    100% {
      translate: 0 16px;
    }
    50% {
      translate: 0 6px;
    }
  }

  #bounce {
    animation: bounce 4s ease-in-out infinite;
  }

  #bounce2 {
    animation: bounce2 4s ease-in-out infinite;
    animation-delay: 0.5s;
  }

  .animatedStop {
    animation: umbral 4s infinite;
  }

  .particle {
    animation: particles 4s ease-in-out infinite;
  }
`;

export default Loader;
