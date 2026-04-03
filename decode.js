const https = require('https');
https.get('https://streamex.sh/live', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        const matches = data.match(/src="([^"]+)"/g);
        if (matches) {
            console.log(matches.slice(0, 30).join('\n'));
        }
    });
});
