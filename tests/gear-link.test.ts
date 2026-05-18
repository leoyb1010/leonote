import { describe, expect, it } from "vitest";
import { parseGearLinkHtml } from "@/lib/gear-link";

describe("gear link preview parser", () => {
  it("extracts product model, brand, price, currency, and specs from JSON-LD", () => {
    const preview = parseGearLinkHtml(
      `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Apple MacBook Pro 14 M4 Pro 24G 1TB",
              "brand": { "name": "Apple" },
              "model": "MacBook Pro 14",
              "description": "M4 Pro chip, 24GB memory, 1TB SSD.",
              "sku": "MBP14-M4P-24-1T",
              "offers": { "@type": "Offer", "price": "16999.00", "priceCurrency": "CNY" },
              "additionalProperty": [
                { "@type": "PropertyValue", "name": "memory", "value": "24GB" },
                { "@type": "PropertyValue", "name": "storage", "value": "1TB" }
              ]
            }
          </script>
        </head>
      </html>
      `,
      "https://shop.example.com/item/123",
    );

    expect(preview.sourceHost).toBe("shop.example.com");
    expect(preview.draft.name).toBe("Apple MacBook Pro 14 M4 Pro 24G 1TB");
    expect(preview.draft.brand).toBe("Apple");
    expect(preview.draft.model).toBe("MacBook Pro 14");
    expect(preview.draft.category).toBe("computer");
    expect(preview.draft.purchasePrice).toBe(1699900);
    expect(preview.draft.currency).toBe("CNY");
    expect(preview.draft.purchaseChannel).toBe("shop.example.com");
    expect(preview.draft.specs).toMatchObject({ memory: "24GB", storage: "1TB", sku: "MBP14-M4P-24-1T" });
    expect(preview.draft.notes).toContain("来源链接：https://shop.example.com/item/123");
  });

  it("falls back to OpenGraph metadata when JSON-LD is unavailable", () => {
    const preview = parseGearLinkHtml(
      `
      <html>
        <head>
          <title>Sony A7C II - Camera Store</title>
          <meta property="og:title" content="Sony A7C II 全画幅微单相机 - Camera Store">
          <meta property="og:description" content="紧凑全画幅机身，适合日常和旅行。">
          <meta property="product:price:amount" content="12999">
          <meta property="product:price:currency" content="CNY">
        </head>
      </html>
      `,
      "https://camera.example.com/products/a7c2",
    );

    expect(preview.draft.name).toContain("Sony A7C II");
    expect(preview.draft.brand).toBe("Sony");
    expect(preview.draft.category).toBe("camera");
    expect(preview.draft.purchasePrice).toBe(1299900);
    expect(preview.description).toContain("紧凑全画幅");
  });
});
