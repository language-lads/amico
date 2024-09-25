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

## TODO

What I want to be able to see for each transcription:

1. Audio of entire conversation, including user speech & assistant EXACTLY as the user hears it
   Assistant speech files

- Server time requested
- Server time received
- Client time started
- Client time ended (maybe only played the first 2 seconds?)
  User speech files
- Client time start
- Client time end
  Can then overlap the assistant speech files with the user speech file and see how they match up, probably with ffmpeg

2. Have the assistant audio appear on the page as the user hears it using [this](https://elevenlabs.io/docs/api-reference/text-to-speech-with-timestamps)

3. Stop the page from going to sleep when the microphone is active

(everything respective to the server)

User: Hello, how are you? (transcription delay)

Assistant: I'm good, how are you? (transcription delay)

### Dokku deployment

```bash
ssh -t <user>@<dokku_server> dokku apps:create amico
git remote add dokku dokku@<dokku_server>:amico
dokku postgres:create amico-db
dokku postgres:link amico-db amico
dokku redis:create amico-redis
dokku redis:link amico-redis amico
dokku config:set RAILS_MASTER_KEY=$(cat config/master.key)
dokku letsencrypt:enable amico
git push dokku main
```

### Very cool demo

It might be possible to run whisper as a dockerized server using [faster-whisper-server](https://github.com/fedirz/faster-whisper-server).

Run the following commands in separate terminals:

```bash
# Start the faster-whisper-server on port 8000
docker run -p 8000:8000 --volume ~/.cache/huggingface:/root/.cache/huggingface --env WHISPER__MODEL=Systran/faster-whisper-tiny fedirz/faster-whisper-server:latest-cpu

# Stream audio from the microphone to the faster-whisper-server via a websocket connection
ffmpeg -f avfoundation -i ":0" -acodec pcm_s16le -ar 16000 -ac 1 -f s16le -loglevel quiet - | websocat --no-close --binary 'ws://localhost:8000/v1/audio/transcriptions?language=en'
```
