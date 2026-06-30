import { Children } from 'react';
import type { ReactNode } from 'react';

interface MasonryGridProps {
  children: ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="pin-masonry-wrapper">
      {Children.map(children, (child, i) => (
        <div key={i} className="pin-masonry-item">
          {child}
        </div>
      ))}
    </div>
  );
}

