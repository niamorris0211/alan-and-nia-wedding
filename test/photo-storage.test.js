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

test("cloud photo validation requires a name and media files", () => {
  assert.match(
    validateUploadInput({
      uploaderName: "",
      files: [{ name: "one.jpg", type: "image/jpeg", size: 100 }],
    }).error,
    /name/i
  );
  assert.match(
    validateUploadInput({
      uploaderName: "Guest",
      files: [{ name: "notes.txt", type: "text/plain", size: 100 }],
    }).error,
    /photo and video/i
  );
});

test("photo admin password comparison is exact", () => {
  assert.equal(timingSafePasswordMatches("correct", "correct"), true);
  assert.equal(timingSafePasswordMatches("wrong", "correct"), false);
  assert.equal(timingSafePasswordMatches("", ""), false);
});
