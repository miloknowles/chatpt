import { cn } from "@/lib/utils"

import { getVideoThumbnailUrl } from "./utils"

/* eslint-disable @next/next/no-img-element -- Exercise media uses user-provided external URLs that are not known at build time. */

type ExerciseMediaProps = {
  exerciseName: string
  imageUrl: string | null
  videoUrl: string | null
  emptyLabel?: string
  className?: string
}

export function ExerciseMedia({
  exerciseName,
  imageUrl,
  videoUrl,
  emptyLabel,
  className,
}: ExerciseMediaProps) {
  const hasImage = Boolean(imageUrl)
  const hasVideo = Boolean(videoUrl)
  const videoThumbnailUrl = videoUrl ? getVideoThumbnailUrl(videoUrl) : null

  if (!hasImage && !hasVideo) {
    return emptyLabel ? <>{emptyLabel}</> : null
  }

  return (
    <div className={cn("space-y-2 text-xs", className)}>
      {hasImage ? (
        <div className="space-y-1">
          <a
            href={imageUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block w-fit overflow-hidden rounded-md border border-border/60"
          >
            <img
              src={imageUrl ?? ""}
              alt={`${exerciseName} image`}
              className="h-14 w-24 object-cover"
              loading="lazy"
            />
          </a>
          <a
            href={imageUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block text-primary underline-offset-4 hover:underline"
          >
            Image
          </a>
        </div>
      ) : null}
      {hasVideo ? (
        <div className="space-y-1">
          {videoThumbnailUrl ? (
            <a
              href={videoUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="block w-fit overflow-hidden rounded-md border border-border/60"
            >
              <img
                src={videoThumbnailUrl}
                alt={`${exerciseName} video preview`}
                className="h-14 w-24 object-cover"
                loading="lazy"
              />
            </a>
          ) : null}
          <a
            href={videoUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block text-primary underline-offset-4 hover:underline"
          >
            Video
          </a>
        </div>
      ) : null}
    </div>
  )
}
