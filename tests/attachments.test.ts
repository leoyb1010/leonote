import { describe, expect, it } from "vitest";
import {
  attachmentContentDisposition,
  isInlineAttachmentMimeType,
  sanitizeAttachmentMimeType,
} from "../src/lib/attachments";

describe("attachment safety helpers", () => {
  it("keeps common images inline but blocks active content types", () => {
    expect(isInlineAttachmentMimeType("image/png")).toBe(true);
    expect(isInlineAttachmentMimeType("application/pdf")).toBe(true);
    expect(sanitizeAttachmentMimeType("image/svg+xml")).toBe("application/octet-stream");
    expect(isInlineAttachmentMimeType("text/html")).toBe(false);
  });

  it("forces active or invalid attachments to download", () => {
    expect(attachmentContentDisposition({ filename: "demo.html", mimeType: "text/html" }))
      .toMatch(/^attachment;/);
    expect(attachmentContentDisposition({ filename: "photo.png", mimeType: "image/png" }))
      .toMatch(/^inline;/);
  });
});
