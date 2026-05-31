export const TAXONOMY_COLOR_OPTIONS = [
  { value: null, label: "None", dotClassName: "bg-transparent" },
  { value: "slate", label: "Slate", dotClassName: "bg-slate-500" },
  { value: "gray", label: "Gray", dotClassName: "bg-gray-500" },
  { value: "zinc", label: "Zinc", dotClassName: "bg-zinc-500" },
  { value: "neutral", label: "Neutral", dotClassName: "bg-neutral-500" },
  { value: "stone", label: "Stone", dotClassName: "bg-stone-500" },
  { value: "red", label: "Red", dotClassName: "bg-red-500" },
  { value: "orange", label: "Orange", dotClassName: "bg-orange-500" },
  { value: "amber", label: "Amber", dotClassName: "bg-amber-500" },
  { value: "yellow", label: "Yellow", dotClassName: "bg-yellow-400" },
  { value: "lime", label: "Lime", dotClassName: "bg-lime-500" },
  { value: "green", label: "Green", dotClassName: "bg-green-500" },
  { value: "emerald", label: "Emerald", dotClassName: "bg-emerald-500" },
  { value: "teal", label: "Teal", dotClassName: "bg-teal-500" },
  { value: "cyan", label: "Cyan", dotClassName: "bg-cyan-500" },
  { value: "sky", label: "Sky", dotClassName: "bg-sky-500" },
  { value: "blue", label: "Blue", dotClassName: "bg-blue-500" },
  { value: "indigo", label: "Indigo", dotClassName: "bg-indigo-500" },
  { value: "violet", label: "Violet", dotClassName: "bg-violet-500" },
  { value: "purple", label: "Purple", dotClassName: "bg-purple-500" },
  { value: "fuchsia", label: "Fuchsia", dotClassName: "bg-fuchsia-500" },
  { value: "pink", label: "Pink", dotClassName: "bg-pink-500" },
  { value: "rose", label: "Rose", dotClassName: "bg-rose-500" },
] as const

const TAXONOMY_COLOR_DOT_CLASSES = new Map<string | null, string>(
  TAXONOMY_COLOR_OPTIONS.map((option) => [option.value, option.dotClassName])
)

export function getTaxonomyColorDotClass(color: string | null | undefined) {
  return TAXONOMY_COLOR_DOT_CLASSES.get(color ?? null) ?? "bg-transparent"
}
