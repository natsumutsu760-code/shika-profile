# MONO LINK:// code〈〉Lounge

deerman_247 の配信の視聴者ラウンジ（レベル・持ち物・持ち玉・コマンド・掲示板）。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/natsumutsu760-code/shika-profile)

- `index.html`：ラウンジのページ
- `worker.js`：門番。Twitch でログインした人のうち、配信者をフォローしていて、BAN・ブロックされていない人にだけ記録を渡す
- 記録はオーバーレイが 10 分ごとに門番へ送り、門番の KV にしまう（このリポジトリには置かない）
