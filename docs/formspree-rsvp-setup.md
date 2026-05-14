# Formspree RSVP Setup

Use this if FormSubmit is being unreliable.

## 1. Create a Formspree Form

1. Go to https://formspree.io/
2. Sign up or log in.
3. Create a new form.
4. Set the target email to `niamorris0211@hotmail.co.uk`.
5. Copy the endpoint. It will look like:

```text
https://formspree.io/f/xxxxxxx
```

Formspree says the endpoint is shown in the dashboard under the form's integration details.

## 2. Send Codex the Endpoint

Send me the endpoint URL and I will paste it into:

```text
rsvp-config.js
```

Like this:

```javascript
window.RSVP_CONFIG = {
  emailSubmitEndpoint: "https://formsubmit.co/niamorris0211@hotmail.co.uk",
  googleAppsScriptUrl: "",
  formspreeEndpoint: "https://formspree.io/f/xxxxxxx",
  fallbackEmail: "niamorris0211@hotmail.co.uk",
};
```

Once pushed, the site will try Formspree before FormSubmit.
