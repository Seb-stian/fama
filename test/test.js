const fama = require('../index');

fama.debug('Hello World!');
fama.addLog('log.txt', 'log', 10, 300);
fama.clearLog('log');
fama.appendLineLog('log', '12');
fama.appendLineLog('log', 'ab');
fama.appendLineLog('log', 'XY');
fama.appendLineLog('log', '+-');
fama.error('Oops!');