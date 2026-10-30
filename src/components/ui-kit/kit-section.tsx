interface KitSectionProps {
  /** Anchor id, also used to label the section for screen readers. */
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** A titled, linkable section of the UI kit page. Later kit issues add one per topic. */
export default function KitSection({ id, title, description, children }: KitSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="w-full scroll-mt-4">
      <h2 id={`${id}-title`} className="section-title text-2xl">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-prose text-burg/70">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
