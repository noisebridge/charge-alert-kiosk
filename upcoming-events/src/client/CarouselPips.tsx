const RADIUS = 12;
const STROKE = 3;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CarouselPips({
  total,
  activeIndex,
  progress,
}: {
  total: number;
  activeIndex: number;
  progress: number;
}) {
  return (
    <div className="flex justify-center items-center gap-3 py-3">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === activeIndex;

        return (
          <div key={i} className="relative">
            <svg width={SIZE} height={SIZE}>
              {/* Background circle (inactive only) */}
              {!isActive && (
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS + STROKE / 2}
                  fill="rgb(229, 231, 235)"
                  stroke="none"
                />
              )}
              {/* Progress ring for active pip */}
              {isActive && (
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="rgb(229, 231, 235)"
                  stroke="rgb(156, 163, 175)"
                  strokeWidth={STROKE}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
