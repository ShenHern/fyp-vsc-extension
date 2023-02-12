const fs = require('fs');
const testFolder = './tests/';

const final = {
  version: '1.0',
  group: 'EventTrace',
  events: [{
    group: 'SIMULATION 1',
    events: []
  }]
};

const merge = () => {
  const files = fs.readdirSync(testFolder);
  for (const file of files) {
    const raw = fs.readFileSync(`${testFolder}/${file}`);
    const obj = JSON.parse(raw);
    final.events[0].events = final.events[0].events.concat(obj.events[0].events);
  }
  final.events[0].events.sort((a, b) => a.time < b.time ? -1 : 1);
  fs.writeFileSync('./trace.json', JSON.stringify(final, null, 4));
  console.log(final);
};

merge();
