# fama
Fama is a small library for console &amp; file logging in nodejs.

## Installation
```bash
npm i fama
```

## Usage
----
```js
const fama = require('fama');

/* CONSOLE */
fama.print('Hello World!'); // prints string
fama.printf({message: 'Hello World!'}); // prints any variable type
fama.error('whoops'); // also warn, debug, info

/* FILE LOGS */
// creates new log with 'myLog' alias
// max character length 5000
// when file reaches max length, it removes lines at the beginning
fama.addLog('logs/log-file.txt', 'myLog', 5000, 'rewrite');
fama.writeLog('myLog', 'Hello\n');
fama.appendLineLog('myLog', 'World!');
fama.clearLog('myLog');
fama.removeLog('myLog');
```
There are multiple supported behaviours for when logs reach their maximum length ('rewrite' in the example):

- stop - stops writing to the log and informs you
- ingore - stops writing to the log
- split - creates new file with the same name and index
- rewrite - removes text from the beginning of the file to make space
- continue - ignores maximum length