const assert = require("node:assert/strict");
const test = require("node:test");
const {
  timingSafePasswordMatches,
  validateUploadInput,
} = require("../lib/photo-storage");

test("cloud photo validation accepts multiple image and video files", () => {
  const result = validateUploadInput({
    uploaderName: "Nia Test",
    files: [
      { name: "one.jpg", type: "image/jpeg", size: 1024 },
      { name: "two.mov", type: "video/quicktime", size: 2048 },
    ],
  });

  assert.equal(result.uploaderName, "Nia Test");
  assert.equal(result.files.length, 2);
});

test("cloud photo validation allows an optional name", () => {
  const result = validateUploadInput({
    uploaderName: "",
    files: [{ name: "one.jpg", type: "image/jpeg", size: 100 }],
  });

  assert.equal(result.uploaderName, "");
  assert.equal(result.files.length, 1);
});

test("cloud photo validation rejects non-media files", () => {
  assert.match(
    validateUploadInput({
      uploaderName: "Guest",
      files: [{ name: "notes.txt", type: "text/plain", size: 100 }],
    }).error,
    /photo and video/i
  );
});

test("cloud photo validation infers common phone media types", () => {
  const result = validateUploadInput({
    uploaderName: "",
    files: [
      { name: "iphone-photo.heic", type: "", size: 100 },
      { name: "iphone-video.MOV", type: "", size: 100 },
    ],
  });

  assert.deepEqual(
    result.files.map((file) => file.type),
    ["image/heic", "video/quicktime"]
  );
});

test("photo admin password comparison is exact", () => {
  assert.equal(timingSafePasswordMatches("correct", "correct"), true);
  assert.equal(timingSafePasswordMatches("wrong", "correct"), false);
  assert.equal(timingSafePasswordMatches("", ""), false);
});
