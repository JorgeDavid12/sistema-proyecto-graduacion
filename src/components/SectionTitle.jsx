export default function SectionTitle({ eyebrow, title, text, align = "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-3 text-sm font-semibold uppercase text-emeraldTech">{eyebrow}</p>
      <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-base leading-8 text-warmWhite/68 sm:text-lg">{text}</p>}
    </div>
  );
}
