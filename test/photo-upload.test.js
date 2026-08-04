const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp } = require("../local-photo-server");

async function withServer(run) {
  const uploadRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "wedding-photo-test-")
  );
  const server = createApp({ uploadRoot }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`, uploadRoot);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  }
}

test("photo upload requires at least one file", async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/photos/upload`, {
      method: "POST",
      body: new FormData(),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /at least one/i);
  });
});

test("photo upload stores metadata and provides a local preview", async () => {
  await withServer(async (origin, uploadRoot) => {
    const formData = new FormData();
    formData.append("uploaderName", "Test Guest");
    formData.append(
      "photos",
      new Blob(["fake image content"], { type: "image/jpeg" }),
      "wedding-photo.jpg"
    );

    const uploadResponse = await fetch(`${origin}/api/photos/upload`, {
      method: "POST",
      body: formData,
    });
    const uploadBody = await uploadResponse.json();

    assert.equal(uploadResponse.status, 201);
    assert.equal(uploadBody.uploadedCount, 1);

    const listResponse = await fetch(`${origin}/api/photos`);
    const listBody = await listResponse.json();
    const [photo] = listBody.photos;

    assert.equal(photo.originalName, "wedding-photo.jpg");
    assert.equal(photo.uploaderName, "Test Guest");
    assert.equal(photo.mimeType, "image/jpeg");
    assert.equal(photo.storedName, undefined);

    const previewResponse = await fetch(`${origin}${photo.previewUrl}`);
    assert.equal(previewResponse.status, 200);
    assert.equal(await previewResponse.text(), "fake image content");

    const downloadResponse = await fetch(
      `${origin}/api/photos/download/${photo.id}`
    );
    assert.equal(downloadResponse.status, 200);
    assert.match(
      downloadResponse.headers.get("content-disposition"),
      /wedding-photo\.jpg/
    );
    assert.equal(await downloadResponse.text(), "fake image content");

    const zipResponse = await fetch(`${origin}/api/photos/download-all`);
    const zipBytes = Buffer.from(await zipResponse.arrayBuffer());
    assert.equal(zipResponse.status, 200);
    assert.match(zipResponse.headers.get("content-type"), /zip/);
    assert.equal(zipBytes.subarray(0, 2).toString("utf8"), "PK");
    assert.equal(fs.existsSync(path.join(uploadRoot, "metadata.json")), true);
  });
});

test("photo upload list shows newest uploads first", async () => {
  await withServer(async (origin) => {
    async function uploadMemory(name, content) {
      const formData = new FormData();
      formData.append("uploaderName", name);
      formData.append(
        "photos",
        new Blob([content], { type: "image/jpeg" }),
        `${name.toLowerCase().replaceAll(" ", "-")}.jpg`
      );

      const response = await fetch(`${origin}/api/photos/upload`, {
        method: "POST",
        body: formData,
      });

      assert.equal(response.status, 201);
    }

    await uploadMemory("First Guest", "older image");
    await uploadMemory("Second Guest", "newer image");

    const listResponse = await fetch(`${origin}/api/photos`);
    const listBody = await listResponse.json();

    assert.deepEqual(
      listBody.photos.map((photo) => photo.uploaderName),
      ["Second Guest", "First Guest"]
    );
  });
});

test("photo upload requires an uploader name", async () => {
  await withServer(async (origin) => {
    const formData = new FormData();
    formData.append(
      "photos",
      new Blob(["fake image content"], { type: "image/jpeg" }),
      "wedding-photo.jpg"
    );

    const response = await fetch(`${origin}/api/photos/upload`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /add your name/i);
  });
});

test("photo upload rejects non-media files", async () => {
  await withServer(async (origin) => {
    const formData = new FormData();
    formData.append(
      "photos",
      new Blob(["not allowed"], { type: "text/plain" }),
      "notes.txt"
    );

    const response = await fetch(`${origin}/api/photos/upload`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /photo and video/i);
  });
});
