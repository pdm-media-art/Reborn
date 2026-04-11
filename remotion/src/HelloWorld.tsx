import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type HelloWorldProps = {
  message: string;
};

export const HelloWorld = ({ message }: HelloWorldProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in over 0.5 s, hold, fade out over 0.5 s at the end
  const fadeIn = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [4.5 * fps, 5 * fps], [0, 1], {
    easing: Easing.bezier(0.7, 0, 0.84, 0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = fadeIn - fadeOut;

  // Slide up 40 px on entrance using the same timing as fade-in
  const translateY = interpolate(frame, [0, 0.5 * fps], [40, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle scale-in: 0.92 → 1.0 over the entrance window
  const scale = interpolate(frame, [0, 0.5 * fps], [0.92, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <p
          style={{
            fontSize: 32,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: 0,
            marginBottom: 16,
          }}
        >
          Welcome to Remotion
        </p>
        <h1
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {message}
        </h1>
        <div
          style={{
            marginTop: 32,
            width: 80,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #6c63ff, #48c6ef)",
            margin: "32px auto 0",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
