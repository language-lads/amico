# Amico

A simple rails app I use to practice my Italian.

## Production

For now, run `good_job` on the web server process

```
GOOD_JOB_EXECUTION_MODE=async rails server
```

## Development

An admin user is created automatically when the database is seeded, with
username `admin@languagelads.com` and password `QTVE9s%Y!!tBfa`.

## Running the models

`silero_vad` and `whisper` should be runnable on the client side using these
lovely tools:

- https://github.com/xenova/transformers.js
- https://github.com/xenova/whisper-web
- https://github.com/microsoft/onnxruntime
- https://onnxruntime.ai/docs/get-started/with-javascript/web.html

The output of these is a series of live "speech utterances" that can then be
passed to the server via ActionCable and processed accordingly.

## TODO

Fix whisper inference on mobile chrome.

- Do it at home on the same wifi and use the inspector
