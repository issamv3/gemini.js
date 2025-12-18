<p align="center">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/1280px-Google_Gemini_logo.svg.png" width="55%" alt="G.logo">
</p>


# gemini.js

JavaScript library for Google Gemini Web API with chat, file upload, image generation, and Gems support.

## Installation

```bash
npm install @jk.mrx/gemini.js
```

## Get Cookies

1. Open [gemini.google.com](https://gemini.google.com)
2. Press `F12` → `Application` → `Cookies`
3. Copy `__Secure-1PSID` and `__Secure-1PSIDTS` or `__Secure-1PSIDCC`

## Quick Start

```javascript
import { Client, Model } from '@jk.mrx/gemini.js';

const client = new Client('PSID', 'PSIDTS');
await client.init();

const response = await client.ask('Hello!');
console.log(response.text);
```

## Models

| Model | Description |
|:------|:------------|
| `Model.DEFAULT` | Default model |
| `Model.FLASH_3` | Gemini 3 Flash |
| `Model.PRO_3` | Gemini 3.0 Pro |
| `Model.PRO_25` | Gemini 2.5 Pro |
| `Model.FLASH_25` | Gemini 2.5 Flash |

```javascript
await client.ask('question', null, Model.PRO_3);
```

## Response Structure

```javascript
const response = await client.ask('Hello!');

response.text       // Main text response
response.think      // Model thinking process
response.images     // All images (web + generated)
response.rcid       // Response candidate ID
response.data       // Raw response data
response.list       // All candidates array

// Candidate structure
response.list[0].text   // Text
response.list[0].think  // Thinking
response.list[0].web    // Web images
response.list[0].gen    // Generated images
response.list[0].rcid   // Candidate ID

// Image structure
image.url           // URL
image.title         // Title
image.alt           // Alt text
```

## Chat Sessions

```javascript
const chat = client.chat(Model.PRO_3);

await chat.send('My name is Ahmed');
const r = await chat.send('What is my name?');
console.log(r.text);
```

## File Upload

```javascript
await client.ask('Describe this image', ['./image.png']);

const chat = client.chat();
await chat.send('Analyze this PDF', ['./doc.pdf']);
```

## Image Generation

```javascript
const response = await client.ask('Generate a sunset image');

for (const image of response.images) {
    console.log(image.url);
    await image.save('images', 'sunset.png');  // Save with name
    await image.save('images');                 // Auto-name
}

// Access separately
const webImages = response.list[0].web;  // From web
const genImages = response.list[0].gen;  // AI generated
```

## Gems

```javascript
const gems = await client.getGems();
const gem = gems.find(null, 'Gemini');
const chat = client.chat(Model.PRO_3, gem);
await chat.send('Hello');

// Manage Gems
const newGem = await client.createGem('Assistant', 'Be helpful', 'Description');
await client.updateGem(newGem, 'New Name', 'New instructions');
await client.deleteGem(newGem);
```

## Error Handling

```javascript
import { AuthError, LimitError, TimeoutError, BlockedError } from '@jk.mrx/gemini.js';

try {
    await client.ask('question');
} catch (e) {
    if (e instanceof AuthError) console.log('Authentication failed');
    if (e instanceof LimitError) console.log('Limit exceeded');
    if (e instanceof TimeoutError) console.log('Timeout');
    if (e instanceof BlockedError) console.log('IP blocked');
}
```

## Advanced Configuration

```javascript
await client.init(
    300000,  // timeout (ms)
    false,   // autoClose
    300000,  // closeDelay (ms)
    true,    // autoRotate cookies
    540000   // rotateInterval (ms)
);

// With Proxy
const client = new Client('PSID', 'PSIDTS', 'http://proxy:PORT');
```

## API Reference

### Client Methods

| Method | Description |
|:-------|:------------|
| `ask(prompt, files?, model?, gem?, chat?)` | Send prompt |
| `chat(model?, gem?)` | Create chat session |
| `getGems(hidden?)` | List gems |
| `createGem(name, prompt, desc?)` | Create gem |
| `updateGem(gem, name, prompt, desc?)` | Update gem |
| `deleteGem(gem)` | Delete gem |
| `close()` | Close connection |

### Chat Methods

| Method | Description |
|:-------|:------------|
| `send(prompt, files?)` | Send message |
| `choose(index)` | Select alternate response |

### Chat Properties

| Property | Description |
|:---------|:------------|
| `cid` | Conversation ID |
| `rid` | Response ID |
| `rcid` | Response candidate ID |
| `data` | Chat data array |

### Image Methods

| Method | Description |
|:-------|:------------|
| `save(dir?, name?)` | Save to file |

<p align="center">thank you <3</p>
