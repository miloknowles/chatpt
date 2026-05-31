import type { Json } from "@/types/database"

import type {
  ExerciseFormValues,
  ExerciseTaxonomySelection,
  UserExercise,
} from "./types"

export function parsePerformanceToFormValues(
  performance: Json | null
): Pick<ExerciseFormValues, "performanceText"> {
  const emptyValues: Pick<ExerciseFormValues, "performanceText"> = {
    performanceText: "",
  }

  if (!performance) {
    return emptyValues
  }

  if (typeof performance === "string") {
    return {
      ...emptyValues,
      performanceText: performance,
    }
  }

  if (typeof performance === "object" && !Array.isArray(performance)) {
    const performanceObject = performance as Record<string, Json | undefined>

    if (Array.isArray(performanceObject.sets)) {
      const rows = performanceObject.sets
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null
          }

          const repsValue = (entry as Record<string, Json | undefined>).reps
          const weightValue = (entry as Record<string, Json | undefined>).weight

          const reps =
            typeof repsValue === "number" && Number.isFinite(repsValue)
              ? String(repsValue)
              : ""
          const weight =
            typeof weightValue === "number" && Number.isFinite(weightValue)
              ? String(weightValue)
              : ""

          if (!reps && !weight) {
            return null
          }

          return { reps, weight }
        })
        .filter((row): row is { reps: string; weight: string } => row !== null)

      const text = rows
        .map((row) => {
          if (row.reps && row.weight) {
            return `${row.reps} reps @ ${row.weight}`
          }
          if (row.reps) {
            return `${row.reps} reps`
          }
          return `Weight: ${row.weight}`
        })
        .join("\n")

      return {
        ...emptyValues,
        performanceText: text,
      }
    }

    const durationSecondsValue = performanceObject.duration_s
    if (
      typeof durationSecondsValue === "number" &&
      Number.isFinite(durationSecondsValue) &&
      durationSecondsValue > 0
    ) {
      return {
        ...emptyValues,
        performanceText: `Duration: ${durationSecondsValue / 60} minutes`,
      }
    }

    const durationMinutesValue = performanceObject.duration_minutes
    if (
      typeof durationMinutesValue === "number" &&
      Number.isFinite(durationMinutesValue) &&
      durationMinutesValue > 0
    ) {
      return {
        ...emptyValues,
        performanceText: `Duration: ${durationMinutesValue} minutes`,
      }
    }

    const textValue = performanceObject.text ?? performanceObject.notes
    if (typeof textValue === "string") {
      return {
        ...emptyValues,
        performanceText: textValue,
      }
    }
  }

  return {
    ...emptyValues,
    performanceText: JSON.stringify(performance, null, 2),
  }
}

export function toFormValues(exercise: UserExercise): ExerciseFormValues {
  const performanceValues = parsePerformanceToFormValues(exercise.performance)

  return {
    name: exercise.name,
    notes: exercise.notes ?? "",
    imageUrl: exercise.image_url ?? "",
    videoUrl: exercise.video_url ?? "",
    types: exercise.types.map((type) => ({
      id: type.id,
      name: type.name,
      display_color: type.display_color,
    })),
    bodyRegions: exercise.body_regions.map((bodyRegion) => ({
      id: bodyRegion.id,
      name: bodyRegion.name,
      display_color: bodyRegion.display_color,
    })),
    ...performanceValues,
  }
}

function toTaxonomyPayload(values: ExerciseTaxonomySelection[]) {
  const existingIds = Array.from(
    new Set(
      values
        .map((value) => value.id?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )
  const customNames = Array.from(
    new Set(
      values
        .filter((value) => !value.id)
        .map((value) => value.name.trim())
        .filter(Boolean)
    )
  )

  return {
    existingIds,
    customNames,
  }
}

export function toPayload(values: ExerciseFormValues) {
  const name = values.name.trim()

  if (!name) {
    return { error: "Name is required." }
  }

  let performance: Json | null = null

  const text = values.performanceText.trim()
  if (text) {
    performance = {
      type: "custom",
      text,
    }
  }

  return {
    payload: {
      name,
      notes: values.notes.trim() || null,
      image_url: values.imageUrl.trim() || null,
      video_url: values.videoUrl.trim() || null,
      performance,
      types: toTaxonomyPayload(values.types),
      body_regions: toTaxonomyPayload(values.bodyRegions),
    },
  }
}

export function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue))
}

function parseUrl(urlValue: string) {
  try {
    return new URL(urlValue)
  } catch {
    return null
  }
}

function getYouTubeVideoId(videoUrl: string) {
  const parsedUrl = parseUrl(videoUrl)
  if (!parsedUrl) {
    return null
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  if (hostname === "youtu.be") {
    const id = parsedUrl.pathname.split("/").filter(Boolean)[0]
    return id || null
  }

  if (hostname.endsWith("youtube.com")) {
    if (parsedUrl.pathname === "/watch") {
      return parsedUrl.searchParams.get("v")
    }

    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean)
    const embedIndex = pathSegments.findIndex(
      (segment) => segment === "embed" || segment === "shorts"
    )
    if (embedIndex >= 0 && pathSegments[embedIndex + 1]) {
      return pathSegments[embedIndex + 1]
    }
  }

  return null
}

function getVimeoVideoId(videoUrl: string) {
  const parsedUrl = parseUrl(videoUrl)
  if (!parsedUrl) {
    return null
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  if (!hostname.endsWith("vimeo.com")) {
    return null
  }

  const match = parsedUrl.pathname.match(/\/(\d+)(?:$|\/)/)
  return match?.[1] ?? null
}

export function getVideoThumbnailUrl(videoUrl: string) {
  const youtubeVideoId = getYouTubeVideoId(videoUrl)
  if (youtubeVideoId) {
    return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`
  }

  const vimeoVideoId = getVimeoVideoId(videoUrl)
  if (vimeoVideoId) {
    return `https://vumbnail.com/${vimeoVideoId}.jpg`
  }

  return null
}
