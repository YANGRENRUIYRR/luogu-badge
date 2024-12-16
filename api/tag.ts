import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import parse from 'node-html-parser';

const logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAADvElEQVR4nNWW3U8cZRTGn/PODLvL7BfLR3dLWQulrTRoWaqlItZQE3vT1Gi8a4xELr0z8Z/RVKOx3tQYvGjTRr1AlwqGBixlsUBpLO3u0mU/2dlldmbe14tB08TdZTHUxHP3Zt55fnPOec7JkBACzzLYM1X/LwBy41crJp/9Y2s9ow90uY8Hm/cZoJv829upm7FMucKXEtrH58OqQ9o3gAAm7+VuLGZMLiRGusmthq3RUA9icW1iLmVaggBAnAipXmejqe8OSBeNb26ncmWTCELA36wM9/oaVN8doJv8u/nN5WSJEQEgwuvH/D1trv0B6CafmNucXM6RXRqBV474LrzYah8bDKo1yWWDX5198uNS1uSCAC4wGHa/3O01LQHApTDGKKDKPe0umdUD1uxVdCX3fSzDBQiQGI0c8b4Tab8cTcyvF2VGjAGAS5FGn/e/HWl3KjUrUf1BqcKnVvMWFwQIgTf6Wj54NdThbRrq8QZUWUAIASGg6db1hfTNxQyvbdrqANPiZYMDO7l7nZLECMDo8ZYPRw+dCKn2kQic48bd9FqqvDeAxymfCntseSJcu5P+9Od4Ml8hQn+n+tGbXSO9PvuriVDUrYxm7A1AhPP9gcHnPLZKyeCT93KXo4lcyQSwtW2tZ3UbzwUiYU9fSN0bAIDPJY8NByNht/irz0sJ7W5cy5XML24l7z8p23N38pD63pmgx1lzL9Wbg1a3Mj4SGurxyhIBcCmspFtf/pL8bb1oq0fC7vHXDrZ7lDoiNefg79B0a21zO6sZikS37hfmHm4B4AIDXe7xkVCru556QwA7irr11XQyupK3j/2dqm3cXV9saCnmy+bXMxtTq3kAQiCgymeP+d216/507J5BumhcmdmYeVAgQAAMYIycCjvgbXproG0w7Km/mnbZphuFyic/xWfWCgRwIXranOf6WjgXxW1rZaP0WTQRS2j1FeqVKKMZn08lFh5rjMAFDvod7w+Hgr6mfNn89cGWxChbMibmUuGA89/YtFSxrs6mFh7tqLe5lbHhUG+Hy+2QLg0F+0LNXIAR/Z4sTS5n61S5OkAI/BDLRldztt99LunSmQP9nTvj2u5RxoZDXQEHF+Ac1+6k5x8W9wZYjGvXF9KcA4Ai0bunOk53e5++0BVwXDzZ1iQTCPmydWU6WWvfVQfEElph2wTABU53e0eO+v7plJcOe84e9TMCAY9y+vRaoapUdZtuFo1YXKtYQmb0Qqdaa1w13Vp4rBW3LRB6O1yHW52NAvYx/v8/v38C9zms4eZ8SGsAAAAASUVORK5CYII=';
interface UserRatingInfo {
    rating: string;
    text: string;
    uid: number;
    tag: string;
}

function escape(username: string) {
    return encodeURIComponent(username.replace(/-/g, '--').replace(/_/g, '__'));
}

function getRatingColor(rating: string) {
    if (rating == 'Purple') return '8e44ad';
    if (rating == 'Red') return 'e74c3c';
    if (rating == 'Orange') return 'e67e22';
    if (rating == 'Green') return '2dce89';
    if (rating == 'Blue') return '0e90d2';
    if (rating == 'Gray') return 'bfbfbf';
    if (rating == 'Brown') return 'ad8b00';
    if (rating == 'Cheater') return 'ad8b00';
    return '808080';
}
async function fetchData(username: string): Promise<UserRatingInfo> {
    const res = await fetch("https://www.luogu.com.cn/api/user/search?keyword="+username);
    if (!res.ok) return { rating: "Gray", text: 'N/A', tag: ''};
    const data = await res.json();
    const user = data.users;
    if (user.length==0) return { rating: 'Gray', text: 'N/A', tag: ''};
    let user0=user[0];
    return {rating: user0.color,text: geta(user0.color)+"名", uid: user0.uid, tag: user0.badge }
}

async function getBadgeImage(username: string, data: UserRatingInfo, style: string) {
    const color = getRatingColor(data.rating);
    const escapedUsername = escape(username);
    let escapedRatingText = escape(data.tag);
    if(data.tag==''){
        escapedRatingText = escape("无TAG")
    }
    const params = new URLSearchParams({
        longCache: 'true',
        style,
        logo,
        link: `https://www.luogu.com.cn/user/`+data.uid,
    }).toString();

    console.log(params);

    const res = await fetch(
        `https://img.shields.io/badge/${escapedUsername}-${escapedRatingText}-${color}.svg?${params}`
    );

    if (!res.ok) throw 'error';
    return await res.text();
}

export default async (request: VercelRequest, response: VercelResponse) => {
    let { username = 'yangrenruiYRR', style = 'for-the-badge' } = request.query;

    if (Array.isArray(username)) username = username[0];
    if (Array.isArray(style)) style = style[0];

    const data = await fetchData(username as string).catch(() => ({ rating: "Gray", text: 'N/A', uid: 0, tag: ''}));
    getBadgeImage(username as string, data, style as string)
        .then((data) => {
            response
                .status(200)
                .setHeader('Content-Type', 'image/svg+xml;charset=utf-8')
                .setHeader('Cache-Control', 'public, max-age=43200') // 43200s（12h） cache
                .send(data);
        })
        .catch(() => {
            response.status(500).send('error');
        });
};
