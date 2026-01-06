import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import bamMascot from "@/assets/bamlead-mascot.png";

interface Mascot3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export default function Mascot3D({ 
  className, 
  size = "md",
  interactive = true 
}: Mascot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [bounce, setBounce] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isHovered) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate rotation based on mouse position
      const rotateY = ((e.clientX - centerX) / rect.width) * 30;
      const rotateX = ((centerY - e.clientY) / rect.height) * 30;

      setRotation({ x: rotateX, y: rotateY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive, isHovered]);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 500);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative cursor-pointer perspective-1000",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
      }}
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      {/* Glow Effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-xl transition-all duration-300",
          isHovered ? "scale-150 opacity-80" : "scale-100 opacity-40"
        )}
      />

      {/* Mascot Container */}
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-200 ease-out",
          bounce && "animate-bounce"
        )}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${isHovered ? "scale(1.1)" : "scale(1)"}`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Main Mascot Image */}
        <img
          src={bamMascot}
          alt="Bam Mascot"
          className="w-full h-full object-contain drop-shadow-2xl"
          draggable={false}
        />

        {/* Sparkle Effects */}
        {isHovered && (
          <>
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"
              style={{ animationDuration: "1s" }}
            />
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className="absolute top-1/2 -right-2 w-2 h-2 bg-accent rounded-full animate-ping"
              style={{ animationDuration: "0.8s" }}
            />
          </>
        )}
      </div>

      {/* Shadow */}
      <div
        className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full bg-black/20 blur-sm transition-all duration-300",
          isHovered ? "scale-75 opacity-30" : "scale-100 opacity-50"
        )}
      />
    </div>
  );
}
