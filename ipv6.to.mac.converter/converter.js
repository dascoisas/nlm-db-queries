module.exports = {

    hex2bin(hex) {
        return (`00000000${(parseInt(hex, 16)).toString(2)}`).substr(-8);
    },

    ipv6ToEUI64(ipv6) {
        let groups = [];
        const halves = ipv6.split('::');

        if (halves.length === 2) {
            let first = halves[0].split(':');
            let last = halves[1].split(':');

            if (first.length === 1 && first[0] === '') {
                first = [];
            }

            if (last.length === 1 && last[0] === '') {
                last = [];
            }

            const remaining = 8 - (first.length + last.length);
            if (!remaining) {
                throw new Error('Error parsing groups');
            }

            groups = groups.concat(first);
            for (let i = 0; i < remaining; i += 1) {
                groups.push('0');
            }

            groups = groups.concat(last);
        } else if (halves.length === 1) {
            groups = ipv6.split(':');
        } else {
            throw new Error('Too many :: groups found');
        }

        let bufferStr = '';
        groups.map((group) => {
            bufferStr += (String(0).repeat(4) + String(group)).slice(String(group).length);
            return true;
        });

        bufferStr = bufferStr.match(/.{1,2}/g).slice(8, 16).join(':');
        let binary = '';
        bufferStr.split(':').forEach((str) => {
            binary += this.hex2bin(str);
        });

        binary = binary.split('');
        binary[6] = 0;
        binary = binary.join('');
        binary = binary.match(/.{1,4}/g).join(' ');
        binary = binary.split(' ');
        let hex = '';
        binary.forEach((group) => {
            hex += parseInt(group, 2).toString(16).toUpperCase();
        });

        return hex.match(/.{1,2}/g).join(':');
    },
}