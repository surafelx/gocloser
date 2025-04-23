// lib/fetchPatch.ts
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (typeof input === "string") {
    if (input.includes("v1beta")) {
      input = input.replace("v1beta", "v1");
    }
  } else if (input instanceof Request) {
    if (input.url.includes("v1beta")) {
      const newUrl = input.url.replace("v1beta", "v1");
      input = new Request(newUrl, input);
    }
  } else if (
    typeof input === "object" &&
    "url" in input &&
    typeof input.url === "string" &&
    input.url.includes("v1beta")
  ) {
    input = { ...input, url: input.url.replace("v1beta", "v1") };
  }
  return originalFetch(input, init);
};
