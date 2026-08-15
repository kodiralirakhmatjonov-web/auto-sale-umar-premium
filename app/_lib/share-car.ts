export type ShareCarResult = "shared" | "copied" | "cancelled" | "unavailable";

interface ShareCarInput {
  slug: string;
  brand: string;
  model: string;
  imageUrl?: string | null;
}

const shareFileCache = new Map<string, File | null>();
const warmingImages = new Set<string>();

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "auto-sale-umar";
}

function extensionForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("avif")) return "avif";
  return "jpg";
}

/**
 * Warm the currently visible image before the user taps Share.
 * Web Share requires transient user activation, so the click handler must not wait
 * for an image download before opening the native share sheet.
 */
export function warmShareImage(imageUrl: string | null | undefined, title: string): void {
  if (typeof window === "undefined" || typeof File === "undefined" || !imageUrl || shareFileCache.has(imageUrl) || warmingImages.has(imageUrl)) return;

  warmingImages.add(imageUrl);
  void fetch(imageUrl, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return null;
      return new File(
        [blob],
        `${safeFileName(title)}.${extensionForMime(blob.type)}`,
        { type: blob.type || "image/jpeg" },
      );
    })
    .then((file) => shareFileCache.set(imageUrl, file))
    .catch(() => shareFileCache.set(imageUrl, null))
    .finally(() => warmingImages.delete(imageUrl));
}

export async function shareCar(input: ShareCarInput): Promise<ShareCarResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "unavailable";

  const title = `${input.brand} ${input.model}`.trim();
  const url = new URL(`/car/?slug=${encodeURIComponent(input.slug)}`, window.location.origin).toString();
  const text = `${title} — Auto Sale Umar`;

  if (typeof navigator.share === "function") {
    try {
      const file = input.imageUrl ? shareFileCache.get(input.imageUrl) : null;
      const fileShareData: ShareData | null = file ? {
        title,
        text: `${text}\n${url}`,
        files: [file],
      } : null;
      // iOS share targets are much more reliable when a file payload does not also
      // include the Web Share `url` field. The direct car URL stays in the caption.
      const canShareFile = Boolean(
        file &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] }),
      );
      if (fileShareData && canShareFile) {
        await navigator.share(fileShareData);
        return "shared";
      }

      // Call navigator.share immediately in the click gesture; never wait for a network request here.
      const sharePromise = navigator.share({ title, text, url });
      await sharePromise;
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Fall through to clipboard when the native sheet rejects the payload.
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return "copied";
    }
  } catch {
    // Ignore clipboard permission failures.
  }

  return "unavailable";
}
