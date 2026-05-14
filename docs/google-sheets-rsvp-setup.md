# Google Sheets RSVP Setup

This replaces FormSubmit with a Google Sheet + email notification.

## 1. Create the Sheet

Create a Google Sheet with a first tab named:

```text
RSVPs
```

Use this header row:

```text
submitted_at | invite_type | guest_slug | household_name | full_name | email_address | attending | attending_guests | not_attending_guests | dietary_requirements | song_request | breakfast_attending | breakfast_not_attending | breakfast_dietary_requirements | minibus_interest | optional_note | optional_message
```

## 2. Add Apps Script

In the Google Sheet:

1. Click `Extensions`
2. Click `Apps Script`
3. Replace the default code with this:

```javascript
const RSVP_EMAIL_TO = "niamorris0211@hotmail.co.uk";

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RSVPs");
  const payload = JSON.parse(e.postData.contents || "{}");

  sheet.appendRow([
    payload.submitted_at || new Date().toISOString(),
    payload.invite_type || "",
    payload.guest_slug || "",
    payload.household_name || "",
    payload.full_name || "",
    payload.email_address || "",
    payload.attending || "",
    formatList(payload.attending_guests),
    formatList(payload.not_attending_guests),
    payload.dietary_requirements || "",
    payload.song_request || "",
    formatList(payload.breakfastAttending),
    formatList(payload.breakfastNotAttending),
    payload.breakfastDietaryRequirements || "",
    payload.minibus_interest || "",
    payload.optional_note || "",
    payload.optional_message || "",
  ]);

  MailApp.sendEmail({
    to: RSVP_EMAIL_TO,
    subject: payload.email_subject || "Wedding RSVP",
    body: payload.email_message || JSON.stringify(payload, null, 2),
  });

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

function formatList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}
```

## 3. Deploy It

1. Click `Deploy`
2. Click `New deployment`
3. Click the cog icon and choose `Web app`
4. Description: `Wedding RSVP endpoint`
5. Execute as: `Me`
6. Who has access: `Anyone`
7. Click `Deploy`
8. Authorise it when Google asks
9. Copy the `Web app URL`

## 4. Paste the URL

Open:

```text
rsvp-config.js
```

Paste the URL here:

```javascript
window.RSVP_CONFIG = {
  emailSubmitEndpoint: "https://formsubmit.co/niamorris0211@hotmail.co.uk",
  googleAppsScriptUrl: "PASTE_YOUR_WEB_APP_URL_HERE",
  fallbackEmail: "niamorris0211@hotmail.co.uk",
};
```

Once that URL is added and pushed, the website will use Google first, with FormSubmit only as backup.
