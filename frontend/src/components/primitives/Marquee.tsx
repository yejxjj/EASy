import { cn } from "@/lib/cn";

/**
 * 무한 흐름 띠.
 *
 * 트랙 하나가 항목을 두 벌 담고 -50% 이동한다. 정확히 한 벌만큼
 * 움직이므로 이음매가 보이지 않는다. 두 번째 벌은 스크린리더가
 * 중복해서 읽지 않도록 aria-hidden 처리한다.
 *
 * `prefers-reduced-motion` 에서는 globals.css 가 애니메이션을 끈다.
 */
interface MarqueeProps {
  items: string[];
  /** 항목 사이 구분자 */
  separator?: string;
  className?: string;
  itemClassName?: string;
}

export function Marquee({
  items,
  separator = "·",
  className,
  itemClassName,
}: MarqueeProps) {
  return (
    <div className={cn("w-full overflow-hidden whitespace-nowrap", className)}>
      <span className="marquee-track">
        {[0, 1].map((pass) => (
          <span key={pass} aria-hidden={pass === 1 || undefined}>
            {items.map((item, i) => (
              <span key={`${item}-${i}`} className={cn("shrink-0", itemClassName)}>
                {item}
                <span className="text-fg-faint mx-4 select-none">{separator}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </div>
  );
}
